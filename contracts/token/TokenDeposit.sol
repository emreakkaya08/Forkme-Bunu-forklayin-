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
import "../core/interface/IERCMINTExt20.sol";

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
    // the role that used for withdraw token
    bytes32 public constant WITHDRAW = keccak256("WITHDRAW");

    IERCMINTExt20 public xToken;

    event WithdrawERC20(
        IERC20Upgradeable indexed token,
        address indexed to,
        uint256 amount
    );

    event DepotisERC20(
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

    function initialize(address _xToken) public initializer {
        __AccessControlEnumerable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __VersionUpgradeable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        xToken = IERCMINTExt20(_xToken);
    }

    function depositERC20(
        IERC20Upgradeable token,
        uint256 amount
    ) public payable nonReentrant whenNotPaused {
        IERC20Upgradeable erc20Token = IERC20Upgradeable(token);

        // make sure the user has approved the transfer of USDT to this contract
        require(
            erc20Token.allowance(msg.sender, address(this)) >= amount,
            "Must approve ERC20Token first"
        );

        // transfer the USDT from the user to this contract
        SafeERC20Upgradeable.safeTransferFrom(
            erc20Token,
            msg.sender,
            address(this),
            amount
        );

        // mint the equivalent amount of XToken to the user
        xToken.mint(msg.sender, amount);

        emit DepotisERC20(msg.sender, msg.value, amount);
    }

    function withdrawERC20(
        IERC20Upgradeable token,
        address to,
        uint256 value
    ) public whenNotPaused nonReentrant onlyRole(WITHDRAW) {
        SafeERC20Upgradeable.safeTransfer(token, to, value);
        emit WithdrawERC20(token, to, value);
    }
}
