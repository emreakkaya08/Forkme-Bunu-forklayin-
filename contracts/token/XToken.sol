// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../core/contract-upgradeable/VersionUpgradeable.sol";

contract XToken is
    Initializable,
    PausableUpgradeable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    VersionUpgradeable,
    ERC20Upgradeable
{
    event XTokenChanged(address from, string _name);

    // the role that can pause the contract
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    // the role that used for upgrading the contract
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    // the role that used for mint X or burn X
    bytes32 public constant X_ADMIN_ROLE = keccak256("X_ADMIN_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __ERC20_init("XToken", "X");
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(X_ADMIN_ROLE, msg.sender);
    }

    //无限 mint
    function continueMinting(
        uint256 amount
    ) public whenNotPaused onlyRole(X_ADMIN_ROLE) {
        _mint(msg.sender, amount);
    }

    //代币销毁
    function burn(uint256 amount) public whenNotPaused onlyRole(X_ADMIN_ROLE) {
        _burn(msg.sender, amount);
    }

    //转移代币的函数，用户可以将代币转移到另一个地址
    function transfer(
        address recipient,
        uint256 amount
    ) public override whenNotPaused returns (bool) {
        require(
            recipient != address(0),
            "XToken: transfer to the zero address"
        );
        require(
            balanceOf(msg.sender) >= amount,
            "XToken: transfer amount exceeds balance"
        );
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    // 批准并调用函数的函数，用户可以批准另一个地址来花费他们的代币
    function approveAndCall(
        address spender,
        uint256 amount
    ) public whenNotPaused returns (bool) {
        approve(spender, amount);
        return true;
    }

    // 重写decimals以设置代币的小数位数
    function decimals() public pure override returns (uint8) {
        return 18;
    }

    /**
     * Returns the version of the contract.
     */
    function _version() internal pure virtual override returns (uint256) {
        return 1;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
