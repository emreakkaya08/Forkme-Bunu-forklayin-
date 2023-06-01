//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../core/contract-upgradeable/VersionUpgradeable.sol";
import "../core/contract-upgradeable/interface/ITokenVault.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";

contract TokenRedeem is
    Initializable,
    AccessControlEnumerableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    VersionUpgradeable
{
    using SafeMath for uint256;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant ADMIN = keccak256("ADMIN");

    event RedeemERC20(
        IERC20Upgradeable indexed token,
        address indexed to,
        uint256 amountX,
        uint256 amounY,
        uint256 reddemAmount
    );

    address private _tokenVault;

    mapping(address => mapping(address => mapping(address => uint256)))
        private _redeemTokenPairs;

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

    function initialize(address tokenVault) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __VersionUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        _tokenVault = tokenVault;
    }

    function addRedeemTokenPair(
        address tokenX,
        address tokenY,
        address redeemToken,
        uint256 rate
    ) public whenNotPaused onlyRole(ADMIN) {
        require(
            tokenX != tokenY && tokenX != redeemToken && tokenY != redeemToken,
            "Token must be different tokens"
        );
        require(
            !hasRedeemTokenPair(tokenX, tokenY, redeemToken),
            "Token pair already exists"
        );
        require(rate > 0, "Rate must be greater than 0");
        _redeemTokenPairs[tokenX][tokenY][redeemToken] = rate;
    }

    function updateRedeemTokenPair(
        address tokenX,
        address tokenY,
        address redeemToken,
        uint256 rate
    ) public whenNotPaused onlyRole(ADMIN) {
        require(
            hasRedeemTokenPair(tokenX, tokenY, redeemToken),
            "Token pair does not exist"
        );
        require(
            rate > 0 && _redeemTokenPairs[tokenX][tokenY][redeemToken] != rate,
            "Rate must be greater than 0 or different from current rate"
        );
        _redeemTokenPairs[tokenX][tokenY][redeemToken] = rate;
    }

    function hasRedeemTokenPair(
        address tokenX,
        address tokenY,
        address redeemToken
    ) public view returns (bool) {
        return _redeemTokenPairs[tokenX][tokenY][redeemToken] > 0;
    }

    function getRedeemTokenAmount(
        address tokenX,
        address tokenY,
        address redeemToken,
        uint256 amountTokenX
    ) public view returns (uint256) {
        require(amountTokenX > 0, "Amount must be greater than 0");
        require(
            hasRedeemTokenPair(tokenX, tokenY, redeemToken),
            "Token pair does not exist"
        );

        uint256 amountTokenY = amountTokenX.div(
            _redeemTokenPairs[tokenX][tokenY][redeemToken]
        );

        // TODO: XY->U usdtAmount need oracle to get
        // set Y default price is 0.1 U
        uint256 redeemTokenAmount = amountTokenY.div(10).add(amountTokenX);

        return redeemTokenAmount;
    }

    function redeemERC20(
        address tokenX,
        address tokenY,
        address redeemToken,
        uint256 amountTokenX
    ) public whenNotPaused nonReentrant {
        require(amountTokenX > 0, "Amount must be greater than 0");
        require(
            hasRedeemTokenPair(tokenX, tokenY, redeemToken),
            "Token pair does not exist"
        );

        uint256 amountTokenY = amountTokenX.div(
            _redeemTokenPairs[tokenX][tokenY][redeemToken]
        );

        ERC20BurnableUpgradeable xToken = ERC20BurnableUpgradeable(tokenX);
        ERC20BurnableUpgradeable yToken = ERC20BurnableUpgradeable(tokenY);

        require(
            xToken.allowance(_msgSender(), address(this)) >= amountTokenX,
            "Must approve XToken first"
        );

        require(
            yToken.allowance(_msgSender(), address(this)) >= amountTokenY,
            "Must approve YToken first"
        );

        require(
            xToken.balanceOf(_msgSender()) >= amountTokenX,
            "Not enough X token"
        );

        require(
            yToken.balanceOf(_msgSender()) >= amountTokenY,
            "Not enough Y token"
        );

        // TODO: XY->U usdtAmount need oracle to get
        // set Y default price is 0.1 U
        uint256 redeemTokenAmount = getRedeemTokenAmount(
            tokenX,
            tokenY,
            redeemToken,
            amountTokenX
        );
        IERC20Upgradeable tokenRedeem = IERC20Upgradeable(redeemToken);
        require(
            tokenRedeem.balanceOf(_tokenVault) >= redeemTokenAmount,
            "Not enough redeem token"
        );

        // burnXY
        xToken.burnFrom(_msgSender(), amountTokenX);
        yToken.burnFrom(_msgSender(), amountTokenY);

        ITokenVault tokenTreasury = ITokenVault(_tokenVault);

        tokenTreasury.withdrawERC20(
            tokenRedeem,
            _msgSender(),
            redeemTokenAmount
        );

        emit RedeemERC20(
            tokenRedeem,
            _msgSender(),
            amountTokenX,
            amountTokenY,
            redeemTokenAmount
        );
    }
}
