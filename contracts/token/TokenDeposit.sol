pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../core/contract-upgradeable/VersionUpgradeable.sol";
import "../core/contract-upgradeable/interface/IERCMINTExt20.sol";
import "../core/contract-upgradeable/interface/ITreasury.sol";

contract TokenDeposit is
    Initializable,
    AccessControlEnumerableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    VersionUpgradeable
{
    // the role that can pause the contract
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    // the role that used for upgrading the contract
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    IERCMINTExt20 public xToken;
    ITreasury public treasury;

    event DepositERC20(
        address indexed user,
        uint256 amount,
        uint256 xTokenAmount
    );

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}

    function _version() internal pure virtual override returns (uint256) {
        return 2;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _xToken, address _treasury) public initializer {
        __AccessControlEnumerable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __VersionUpgradeable_init();
        __ReentrancyGuard_init();

        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        xToken = IERCMINTExt20(_xToken);
        treasury = ITreasury(_treasury);
    }

    function _calculateMintAmountByTokenAmount(
        IERC20Upgradeable token,
        uint256 amount
    ) internal pure returns (uint256) {
        return amount;
    }

    function depositERC20(
        IERC20Upgradeable token,
        uint256 amount
    ) public payable nonReentrant whenNotPaused {
        address toAddress = _msgSender();
        // transfer the USDT from the user to treasury contract
        treasury.depositERC20(token, amount);
        uint256 mintAmount = _calculateMintAmountByTokenAmount(token, amount);

        // mint the equivalent amount of XToken to the user
        xToken.mint(toAddress, mintAmount);

        emit DepositERC20(toAddress, amount, mintAmount);
    }
}
