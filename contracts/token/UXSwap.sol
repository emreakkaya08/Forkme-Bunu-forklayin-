pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../core/contract-upgradeable/VersionUpgradeable.sol";
import "./StableTokenX.sol";

contract UXSwap is
    Initializable,
    AccessControlEnumerableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable,
    VersionUpgradeable
{
    using SafeERC20 for IERC20;

    // the role that can pause the contract
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    // the role that used for upgrading the contract
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    IERC20 public usdt;
    StableTokenX public xToken;

    event Swapped(address indexed user, uint256 amount, uint256 xTokenAmount);

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
        return 1;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _usdt, address _xToken) public initializer {
        __AccessControlEnumerable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        usdt = IERC20(_usdt);
        xToken = StableTokenX(_xToken);
    }

    function swap(uint256 amount) public payable {
        // make sure the user has approved the transfer of USDT to this contract
        require(
            usdt.allowance(msg.sender, address(this)) >= amount,
            "Must approve USDT first"
        );

        // transfer the USDT from the user to this contract
        usdt.safeTransferFrom(msg.sender, address(this), amount);

        // todo
        xToken.approve(address(this), amount);

        // mint the equivalent amount of XToken to the user
        xToken.mint(msg.sender, amount);

        emit Swapped(msg.sender, msg.value, amount);
    }
}
