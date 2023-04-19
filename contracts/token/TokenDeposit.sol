//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

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

    address public treasury;

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
        return 4;
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
        treasury = 0xB008F2B780d09Cf6F5bded95b27baB04f2ad40A7;
    }

    function _checkTokenAllowance(
        IERC20Upgradeable token
    ) internal pure returns (bool) {
        return true;
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
        require(_checkTokenAllowance(token), "token is not allowed to deposit");

        IERC20Upgradeable erc20Token = IERC20Upgradeable(token);

        address toAddress = _msgSender();

        // make sure the user has approved the transfer of USDT to this contract
        require(
            erc20Token.allowance(toAddress, address(this)) >= amount,
            "Must approve ERC20Token first"
        );

        // transfer the USDT from the user to treasury contract
        SafeERC20Upgradeable.safeTransferFrom(
            erc20Token,
            toAddress,
            treasury,
            amount
        );

        uint256 mintAmount = _calculateMintAmountByTokenAmount(token, amount);

        // mint the equivalent amount of XToken to the user
        xToken.mint(toAddress, mintAmount);

        emit DepositERC20(toAddress, amount, mintAmount);
    }

    function setTreasury(
        address _treasury
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        treasury = _treasury;
    }

    function getTreasury() public view returns (address) {
        return treasury;
    }
}
