//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/finance/PaymentSplitterUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "../../core/contract-upgradeable/interface/ITokenVault.sol";
import "../../core/contract-upgradeable/VersionUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "../../core/contract-upgradeable/GameCoefficientBallot.sol";
import "../../core/contract-upgradeable/PlayerConsumeRecord.sol";

contract PlayerPaymentSplitter is
    Initializable,
    AccessControlEnumerableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable,
    VersionUpgradeable
{
    using AddressUpgradeable for address;

    event ClaimReward(
        address indexed player,
        address indexed game,
        uint256 amount
    );

    IERC20Upgradeable private tokenZOIC;
    GameCoefficientBallot private gameCoefficientBallot;
    PlayerConsumeRecord private playerConsumeRecord;

    address private gamePool;

    mapping(address => uint256) private playerWithdrawn;

    mapping(address => bool) private blockedList;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant BALLOT_ROLE = keccak256("BALLOT_ROLE");
    bytes32 public constant SPONSOR_ROLE = keccak256("SPONSOR_ROLE");

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
        address token,
        address _gamePool,
        address _gameCoefficientBallot,
        address _playerConsumeRecord
    ) public initializer {
        __AccessControlEnumerable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __VersionUpgradeable_init();

        tokenZOIC = IERC20Upgradeable(token);
        gameCoefficientBallot = GameCoefficientBallot(_gameCoefficientBallot);
        playerConsumeRecord = PlayerConsumeRecord(_playerConsumeRecord);
        gamePool = _gamePool;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    function _getGameCoefficientThisCycle(
        address _game,
        uint64 _timestamp
    ) internal view returns (uint256 coefficient, uint256 totalCoefficient) {
        (coefficient, totalCoefficient) = gameCoefficientBallot
            .getGameCoefficient(_game, _timestamp);
    }

    function _getPlayerConsumeRecordThisCycle(
        address _player,
        address _game
    )
        internal
        view
        returns (
            uint256 cenoConsumed,
            uint256 gasUsed,
            uint256 cenoConsumedTotal,
            uint256 gasUsedTotal
        )
    {
        (
            cenoConsumed,
            gasUsed,
            cenoConsumedTotal,
            gasUsedTotal
        ) = playerConsumeRecord.getPlayerConsumeRecordThisCycle(_player, _game);
    }

    function _getPlayerConsumeRecordLastCycle(
        address _player,
        address _game
    )
        internal
        view
        returns (
            uint256 cenoConsumed,
            uint256 gasUsed,
            uint256 cenoConsumedTotal,
            uint256 gasUsedTotal
        )
    {
        (
            cenoConsumed,
            gasUsed,
            cenoConsumedTotal,
            gasUsedTotal
        ) = playerConsumeRecord.getPlayerConsumeRecordLastCycle(_player, _game);
    }

    function releasableThisCycle(
        address _game
    ) public view returns (uint256 releasable) {
        // player gets the amount of ZOIC that will be released in this cycle in this game

        uint64 _timestamp = uint64(block.timestamp);
        address _player = msg.sender;

        uint256 releasedZOIC = 10000000000;
        // get the amount of ZOIC that will be released in this cycle
        // from the ZOIC vault splitter
        // uint256 releasedZOIC = tokenCofferPaymentSplitter.releasedZOIC();

        (
            uint256 _coefficient,
            uint256 _totalCoefficient
        ) = _getGameCoefficientThisCycle(_game, _timestamp);

        (
            uint256 _cenoConsumed,
            uint256 _gasUsed,
            uint256 _cenoConsumedTotal,
            uint256 _gasUsedTotal
        ) = _getPlayerConsumeRecordThisCycle(_player, _game);

        _cenoConsumedTotal;
        _gasUsedTotal;

        // Reward(A)=rY*52%*K*[P(A)/P(N)]
        // TODO : veToken and inviteReward
        releasable =
            (releasedZOIC *
                _coefficient *
                (6 *
                    (_cenoConsumed < 1 ? 1 : _cenoConsumed) +
                    4 *
                    (_gasUsed < 1 ? 1 : _gasUsed))) /
            _totalCoefficient /
            100;
    }

    function releasableLastCycle(
        address _game
    ) public view returns (uint256 releasable) {
        // player gets the amount of ZOIC that will be released in this cycle in this game

        uint64 _timestamp = uint64(block.timestamp);
        address _player = msg.sender;

        uint256 releasedZOIC = 10000000000;
        // get the amount of ZOIC that will be released in this cycle
        // from the ZOIC vault splitter
        // uint256 releasedZOIC = tokenCofferPaymentSplitter.releasedZOIC();

        // TODO the consequence of ballot and cycle
        (
            uint256 _coefficient,
            uint256 _totalCoefficient
        ) = _getGameCoefficientThisCycle(_game, _timestamp);

        (
            uint256 _cenoConsumed,
            uint256 _gasUsed,
            uint256 _cenoConsumedTotal,
            uint256 _gasUsedTotal
        ) = _getPlayerConsumeRecordLastCycle(_player, _game);

        _cenoConsumedTotal;
        _gasUsedTotal;

        // Reward(A)=rY*52%*K*[P(A)/P(N)]
        // TODO : veToken and inviteReward
        releasable =
            (releasedZOIC *
                _coefficient *
                (6 *
                    (_cenoConsumed < 1 ? 1 : _cenoConsumed) +
                    4 *
                    (_gasUsed < 1 ? 1 : _gasUsed))) /
            _totalCoefficient /
            100;
    }

    function claim(address _game) public whenNotPaused {
        uint256 releasable = releasableLastCycle(_game);

        require(releasable > 0, "releasable must be greater than 0");

        SafeERC20Upgradeable.safeTransferFrom(
            tokenZOIC,
            gamePool,
            msg.sender,
            releasable
        );

        emit ClaimReward(msg.sender, _game, releasable);
    }
}
