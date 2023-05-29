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
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "../core/contract-upgradeable/VersionUpgradeable.sol";

contract TokenTreasury is
    Initializable,
    AccessControlEnumerableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    VersionUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant WITHDRAW = keccak256("WITHDRAW");
    bytes32 public constant WITHDRAW_ERC20 = keccak256("WITHDRAW_ERC20");

    event TokenReceived(address from, uint256 amount);
    event Withdraw(address to, uint256 amount);
    event WithdrawERC20(
        IERC20Upgradeable indexed token,
        address indexed to,
        uint256 amount
    );

    //nonces for address
    mapping(address => uint256) public nonces;

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
        __AccessControlEnumerable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __VersionUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    receive() external payable virtual {
        emit TokenReceived(_msgSender(), msg.value);
    }

    function getNonce() public view returns (uint256) {
        return nonces[_msgSender()];
    }

    function recoverSigner(
        bytes32 hash,
        bytes memory signature
    ) public pure returns (address) {
        bytes32 ethSign = ECDSAUpgradeable.toEthSignedMessageHash(hash);
        return ECDSAUpgradeable.recover(ethSign, signature);
    }

    function _checkWithdrawRoleWithSignature(
        address to,
        uint256 amount,
        bytes memory signature,
        bytes32 role
    ) internal {
        uint256 nonce = nonces[to];
        nonces[to] = nonce + 1;
        address signer = recoverSigner(
            keccak256(abi.encodePacked(to, amount, nonce)),
            signature
        );
        _checkRole(role, signer);
    }

    function _withdraw(
        address payable to,
        uint256 amount
    ) internal whenNotPaused {
        AddressUpgradeable.sendValue(to, amount);
        emit Withdraw(to, amount);
    }

    function _withdrawERC20(
        IERC20Upgradeable token,
        address to,
        uint256 value
    ) internal whenNotPaused {
        SafeERC20Upgradeable.safeTransfer(token, to, value);
        emit WithdrawERC20(token, to, value);
    }

    function withdrawWithSignature(
        uint256 amount,
        bytes memory signature
    ) public whenNotPaused nonReentrant {
        address _to = _msgSender();
        _checkWithdrawRoleWithSignature(_to, amount, signature, WITHDRAW);
        _withdraw(payable(_to), amount);
    }

    function withdrawERC20WithSignature(
        IERC20Upgradeable token,
        uint256 value,
        bytes memory signature
    ) public whenNotPaused nonReentrant {
        address _to = _msgSender();

        _checkWithdrawRoleWithSignature(_to, value, signature, WITHDRAW_ERC20);

        _withdrawERC20(token, _to, value);
    }
}
