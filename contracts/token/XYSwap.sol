// SPDX-License-Identifier: SEE LICENSE IN LICENSE
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

/**
 * @title XYSwap
 * @author
 */
contract XYSwap is
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
    // the role that used for minting the token
    bytes32 public constant WITHDRAW = keccak256("WITHDRAW");

    bytes32 public constant TRANSFUL = keccak256("TRANSFUL");

    ERC20Upgradeable public yToken;

    address public yTokenAccount;

    uint public conversionRate;

    event WithdrawERC20(
        IERC20Upgradeable indexed token,
        address indexed to,
        uint256 amount
    );

    event DepositERC20(
        address indexed user,
        uint256 xTokenAmount,
        uint256 yTokenAmount
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

    function initialize(
        address _yToken,
        address _yTokenAccount,
        uint _conversionRate
    ) public initializer {
        __AccessControlEnumerable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __VersionUpgradeable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        yToken = ERC20Upgradeable(_yToken);
        yTokenAccount = _yTokenAccount;
        conversionRate = _conversionRate;
    }

    function _checkTokenAllowance(
        ERC20Upgradeable token
    ) internal pure returns (bool) {
        return true;
    }

    function XConversionY(
        ERC20Upgradeable token,
        uint256 xAmount
    ) public payable nonReentrant whenNotPaused {
        require(_checkTokenAllowance(token), "token is not allowed to deposit");

        ERC20Upgradeable erc20Token = ERC20Upgradeable(token);

        address toAddress = _msgSender();

        require(
            erc20Token.allowance(toAddress, address(this)) >= xAmount,
            "Must approve ERC20Token first"
        );

        // transfer the X from the user to this contract
        SafeERC20Upgradeable.safeTransferFrom(
            erc20Token,
            toAddress,
            address(this),
            xAmount
        );

        //转移 Y 给调用地址,X:Y比例暂定 1:2
        uint256 yAmount = xAmount * conversionRate;
        yToken.approve(yTokenAccount, yAmount);
        SafeERC20Upgradeable.safeTransferFrom(
            yToken,
            toAddress,
            yTokenAccount,
            yAmount
        );
        emit DepositERC20(toAddress, xAmount, yAmount);
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
