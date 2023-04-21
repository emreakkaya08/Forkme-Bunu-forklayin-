//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../core/contract-upgradeable/VersionUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract RedeemU is
    Initializable,
    AccessControlEnumerableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    VersionUpgradeable,
    ERC20BurnableUpgradeable
{
    // the role that can pause the contract
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    // the role that used for upgrading the contract
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    address public treasury;
    address public xToken;
    address public yToken;
    using SafeMath for uint256;

    event RedeemRC20(
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
        __ERC20Burnable_init();
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __VersionUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    function redeemERC20(
        uint256 _amountX,
        IERC20Upgradeable usdt
    ) public whenNotPaused nonReentrant {
        IERC20Upgradeable u = IERC20Upgradeable(usdt);
        // check amount
        // example 1 X = 2 Y
        require(_amountX > 0, "Amount must be greater than 0");
        uint256 _amountY = (((_amountX.mul(10)).div(9)).div(10)).mul(2);

        uint256 reddemAmount = _amountX.mul(10).div(9);

        require(treasury != address(0), "Treasury not set");
        require(xToken != address(0), "XToken not set");
        require(yToken != address(0), "YToken not set");
        require(u.balanceOf(treasury) >= reddemAmount, "Not enough USDT");

        require(
            u.allowance(treasury, address(this)) >= reddemAmount,
            "Must approve treasury USDT first"
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

        emit RedeemRC20(usdt, _amountX, reddemAmount);
    }

    function burnXY(uint256 _amountX, uint256 _amountY) internal {
        IERC20Upgradeable x_token = IERC20Upgradeable(xToken);
        IERC20Upgradeable y_token = IERC20Upgradeable(yToken);
        ERC20BurnableUpgradeable burnXToken = ERC20BurnableUpgradeable(
            address(x_token)
        );
        ERC20BurnableUpgradeable burnYToken = ERC20BurnableUpgradeable(
            address(y_token)
        );
        require(
            x_token.allowance(msg.sender, address(this)) >= _amountX,
            "Must approve XToken first"
        );

        require(
            y_token.allowance(msg.sender, address(this)) >= _amountY,
            "Must approve YToken first"
        );

        require(x_token.balanceOf(msg.sender) >= _amountX, "Not enough XToken");

        require(y_token.balanceOf(msg.sender) >= _amountY, "Not enough XToken");

        // burn X
        burnXToken.burnFrom(msg.sender, _amountX);

        // burn Y
        burnYToken.burnFrom(msg.sender, _amountY);
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
