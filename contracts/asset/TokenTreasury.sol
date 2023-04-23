//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "../core/contract-upgradeable/VersionUpgradeable.sol";

contract TokenTreasury is
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
    bytes32 public constant WITHDRAW = keccak256("WITHDRAW");

    event TokenReceived(address from, uint256 amount);

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

    event WithdrawERC20(
        IERC20Upgradeable indexed token,
        address indexed to,
        uint256 amount
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __AccessControlEnumerable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __VersionUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(WITHDRAW, msg.sender);
    }

    receive() external payable virtual {
        emit TokenReceived(_msgSender(), msg.value);
    }

    // withdraw ERC20 token
    function withdrawERC20(
        IERC20Upgradeable tokenAddress,
        address to,
        uint256 amount
    ) public whenNotPaused nonReentrant onlyRole(WITHDRAW) {
        require(amount > 0, "Amount must be greater than zero");
        IERC20Upgradeable token = IERC20Upgradeable(tokenAddress);
        
        uint256 senderBalance = token.balanceOf(address(this));
        require(senderBalance >= amount, "Insufficient balance");
        SafeERC20Upgradeable.safeTransfer(token, to, amount);
        emit WithdrawERC20(token, to, amount);
    }
}
