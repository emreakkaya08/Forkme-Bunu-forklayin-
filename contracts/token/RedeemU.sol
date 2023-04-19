//SPDX-License-Identifier: Unlicense
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

contract RedeemU is
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
    bytes32 public constant REDDEM = keccak256("REDDEM");

    address public treasury;
    address public xToken;
    address public yToken;

    event ReddemRC20(
        IERC20Upgradeable indexed token,
        uint256 _amountX,
        uint256 reddemAmount
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

    function initialize() public initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __VersionUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REDDEM, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    function reddemERC20(
        uint _amountX,
        IERC20Upgradeable usdt
    ) public whenNotPaused nonReentrant onlyRole(REDDEM) {
        IERC20Upgradeable u = IERC20Upgradeable(usdt);
        // check amount
        // example 1 X = 2 Y
        require(_amountX > 0, "Amount must be greater than 0");
        uint256 _amountY = (((_amountX * 10) / 9) / 10) * 2;

        uint256 reddemAmount = (_amountX * 10) / 9;

        require(treasury != address(0), "Treasury not set");
        require(xToken != address(0), "XToken not set");
        require(yToken != address(0), "YToken not set");
        require(
            u.balanceOf(treasury) >= reddemAmount,
            "Not enough U"
        );

        // 90% X and 10 % Y burn
        burnXY(_amountX, _amountY);

        // transfer U to User
        SafeERC20Upgradeable.safeTransferFrom(
            u,
            treasury,
            msg.sender,
            reddemAmount
        );

        emit ReddemRC20(usdt, _amountX, reddemAmount);
    }

    function burnXY(uint _amountX, uint _amountY) internal onlyRole(REDDEM) {
        IERC20Upgradeable xToken = IERC20Upgradeable(xToken);
        IERC20Upgradeable yToken = IERC20Upgradeable(yToken);
        require(
            xToken.allowance(msg.sender, address(this)) >= _amountX,
            "Must approve XToken first"
        );

        require(
            yToken.allowance(msg.sender, address(this)) >= _amountY,
            "Must approve YToken first"
        );
        // burn X
        xToken._burn(_amountX);

        // burn Y
        yToken.burn(_amountY);
    }

    function setTokens(
        address _treasury,
        address _xToken,
        address _yToken
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        treasury = _treasury;
        xToken = _xToken;
        yToken = _yToken;
    }
}
