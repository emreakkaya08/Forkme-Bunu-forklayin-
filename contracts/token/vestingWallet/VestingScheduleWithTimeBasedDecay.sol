//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import "../../core/contract-upgradeable/VersionUpgradeable.sol";
import "../../core/contract-upgradeable/finance/VestingByTimeBlockWalletUpgradeable.sol";
import "../../providers/datetime/DateTime.sol";

contract VestingScheduleWithTimeBasedDecay is
    Initializable,
    ReentrancyGuardUpgradeable,
    AccessControlEnumerableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable,
    VersionUpgradeable,
    VestingByTimeBlockWalletUpgradeable
{
    using SafeMath for uint256;

    struct TokenInfo {
        uint32 currentReleaseTimes;
        uint32 totalReleaseTimes;
        uint64 releaseInterval;
        uint256 precision;
        uint256 decay;
        uint256 totalSupply;
        uint256 baseSupply;
    }

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant TOKEN_SETTER_ROLE = keccak256("TOKEN_SETTER_ROLE");
    bytes32 public constant START_TIME_SETTER_ROLE =
        keccak256("START_TIME_SETTER_ROLE");

    uint64 private _startTimeStamp;

    mapping(address => TokenInfo) private _tokenInfo;

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
        address beneficiaryAddress,
        uint64 startTimestamp,
        uint64 durationSeconds
    ) public initializer {
        __AccessControlEnumerable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __VersionUpgradeable_init();
        __VestingByTimeBlockWallet_init(
            beneficiaryAddress,
            startTimestamp,
            durationSeconds
        );

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    function _vestingSchedule(
        uint256 totalAllocation,
        uint64 timestamp
    ) internal view virtual override whenNotPaused returns (uint256) {
        return super._vestingSchedule(totalAllocation, timestamp);
    }

    function release(
        address token
    ) public virtual override whenNotPaused nonReentrant {
        super.release(token);

        TokenInfo memory tokenInfo = _tokenInfo[token];
        tokenInfo.currentReleaseTimes = tokenInfo.currentReleaseTimes + 1;
        _tokenInfo[token] = tokenInfo;
    }

    function vestedAmount(
        address token,
        uint64 timestamp
    ) public view virtual override returns (uint256) {
        require(token != address(0), "token is zero address");
        TokenInfo memory tokenInfo = _tokenInfo[token];
        require(
            _tokenInfo[token].totalReleaseTimes > 0,
            "token has not been set"
        );
        if (timestamp < start()) {
            return 0;
        }

        uint256 amount = released(token);
        uint256 times = (timestamp - start()) / tokenInfo.releaseInterval;

        require(
            times <= tokenInfo.totalReleaseTimes / 3,
            "too far away from last release time"
        );

        if (tokenInfo.currentReleaseTimes < times) {
            for (
                uint32 i = tokenInfo.currentReleaseTimes + 1;
                i <= times;
                i++
            ) {
                amount = amount.add(tokenReleaseAmount(token, i));
            }
        }
        return amount;
    }

    function start() public view virtual override returns (uint256) {
        return _startTimeStamp == 0 ? super.start() : _startTimeStamp;
    }

    function setStartTime(
        uint64 timestamp
    ) public whenNotPaused onlyRole(START_TIME_SETTER_ROLE) {
        require(_startTimeStamp == 0, "start time already set");
        _startTimeStamp = timestamp;
    }

    function addTokenInfo(
        address token,
        uint32 totalReleaseTimes,
        uint8 decayPerTime,
        uint32 releaseInterval,
        uint256 totalSupply
    ) public whenNotPaused onlyRole(TOKEN_SETTER_ROLE) {
        require(token != address(0), "token is zero address");
        require(_tokenInfo[token].totalReleaseTimes == 0, "token already set");
        require(totalReleaseTimes > 0, "total times must be greater than 0");
        require(decayPerTime > 0, "decay must be greater than 0");
        require(totalSupply > 0, "supply must be greater than 0");
        require(releaseInterval > 0, "interval must be greater than 0");

        uint8 decimals = ERC20Upgradeable(token).decimals();
        uint256 precision = 10 ** uint256(decimals);
        uint256 decay = (uint256(100 - decayPerTime)) * precision.div(100);

        uint256 result = decay;
        for (uint64 i = 1; i < totalReleaseTimes; i++) {
            result = result.mul(decay).div(precision);
        }

        uint256 numerator = 1 * precision - decay;
        uint256 coefficient = (1 * precision - result).mul(precision).div(
            numerator
        );

        _tokenInfo[token] = TokenInfo({
            currentReleaseTimes: 0,
            totalReleaseTimes: totalReleaseTimes,
            decay: decay,
            precision: precision,
            totalSupply: totalSupply,
            releaseInterval: releaseInterval,
            baseSupply: totalSupply.div(coefficient)
        });
    }

    function tokenReleaseAmount(
        address token,
        uint32 times
    ) public view returns (uint256) {
        TokenInfo memory tokenInfo = _tokenInfo[token];
        require(tokenInfo.totalReleaseTimes > 0, "token not set");
        require(times > 0, "times must be greater than 0");

        uint256 totalSupply = tokenInfo.totalSupply;

        if (totalSupply == 0) {
            return 0;
        }

        if (times == 1) {
            return tokenInfo.baseSupply.mul(tokenInfo.precision);
        } else {
            uint256 decayN = tokenInfo.decay;
            for (uint32 i = 1; i < times - 1; i++) {
                decayN = decayN.mul(tokenInfo.decay).div(tokenInfo.precision);
            }
            return tokenInfo.baseSupply.mul(decayN);
        }
    }
}
