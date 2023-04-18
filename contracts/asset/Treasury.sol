// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../core/contract-upgradeable/VersionUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Treasury is
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
    // the role that used for withdraw the token
    bytes32 public constant WITHDRAW = keccak256("WITHDRAW");

    mapping(address => uint256) public balances;

    event DepositERC20(address indexed user, uint256 amount);

    event WithdrawERC20(
        IERC20Upgradeable indexed token,
        address indexed to,
        uint256 amount
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
        return 1;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __VersionUpgradeable_init();

        _grantRole(WITHDRAW, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

    }

    function _checkTokenAllowance(
        IERC20Upgradeable token
    ) internal pure returns (bool) {
        return true;
    }

    // deposit ERC20 token
    function depositERC20(
        IERC20Upgradeable _ERC20Token,
        uint256 amount
    ) public payable nonReentrant whenNotPaused {
        require(
            _checkTokenAllowance(_ERC20Token),
            "token is not allowed to deposit"
        );
        IERC20Upgradeable erc20Token = IERC20Upgradeable(_ERC20Token);

        address toAddress = _msgSender();

        // make sure the user has approved the transfer of USDT to this contract
        require(
            erc20Token.allowance(toAddress, address(this)) >= amount,
            "Must approve ERC20Token first"
        );

        // transfer the USDT from the user to this contract
        SafeERC20Upgradeable.safeTransferFrom(
            erc20Token,
            toAddress,
            address(this),
            amount
        );
        balances[toAddress] += amount;
        emit DepositERC20(toAddress, amount);
    }

    // withdraw ERC20 token
    function withdrawERC20(
        IERC20Upgradeable token,
        address to,
        uint256 value
    ) public whenNotPaused nonReentrant onlyRole(WITHDRAW) {
        SafeERC20Upgradeable.safeTransfer(token, to, value);
        balances[msg.sender] -= value;
        emit WithdrawERC20(token, to, value);
    }

    function getBalance() public view returns (uint256) {
        return balances[msg.sender];
    }
}
