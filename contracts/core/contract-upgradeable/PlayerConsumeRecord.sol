//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./VersionUpgradeable.sol";
import "../../core/utils/CycleUtils.sol";

contract PlayerConsumeRecord is
    Initializable,
    AccessControlEnumerableUpgradeable,
    UUPSUpgradeable,
    VersionUpgradeable
{
    using AddressUpgradeable for address;

    event PlayerConsumeRecorded(
        address indexed player,
        address indexed game,
        uint256 cenoConsumed,
        uint256 gasUsed
    );

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");

    struct ConsumeRecordDetail {
        uint256 cenoConsumed;
        uint256 gasUsed;
    }

    mapping(address => mapping(address => ConsumeRecordDetail))
        private consumeRecord;
    mapping(address => ConsumeRecordDetail) private gameConsumeRecord;

    mapping(address => mapping(address => ConsumeRecordDetail))
        private consumeRecordLastCycle;
    mapping(address => ConsumeRecordDetail) private gameConsumeRecordLastCycle;

    function _version() internal pure virtual override returns (uint256) {
        return 1;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override {}

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __AccessControlEnumerable_init();
        __UUPSUpgradeable_init();
        __VersionUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(RECORDER_ROLE, msg.sender);
    }

    function _updatePlayerRecord(
        address _player,
        address _game,
        uint256 _cenoConsumed,
        uint256 _gasUsed
    ) internal {

        require(_cenoConsumed > 0, "Invalid cenoConsumed");
        require(_gasUsed > 0, "Invalid gasUsed");

        // CycleUtils.isInThisCycle(_timestamp);

        ConsumeRecordDetail storage _consumeRecordDetail = consumeRecord[
            _player
        ][_game];
        _consumeRecordDetail.cenoConsumed += _cenoConsumed;
        _consumeRecordDetail.gasUsed += _gasUsed;

        ConsumeRecordDetail storage _gameConsumeRecord = gameConsumeRecord[
            _game
        ];
        _gameConsumeRecord.cenoConsumed += _cenoConsumed;
        _gameConsumeRecord.gasUsed += _gasUsed;

        emit PlayerConsumeRecorded(_player, _game, _cenoConsumed, _gasUsed);
    }

    function updatePlayerRecord(

        address _player,
        address _gamePlayed,
        uint256 _cenoConsumed,
        uint256 _gasUsed
    ) public onlyRole(RECORDER_ROLE) {
        _updatePlayerRecord(

            _player,
            _gamePlayed,
            _cenoConsumed,
            _gasUsed
        );
    }

    function getPlayerConsumeRecordThisCycle(
        address _player,
        address _game
    )
        public
        view
        returns (
            uint256 cenoConsumed,
            uint256 gasUsed,
            uint256 cenoConsumedTotal,
            uint256 gasUsedTotal
        )
    {
        ConsumeRecordDetail storage _consumeRecord = consumeRecord[_player][
            _game
        ];
        ConsumeRecordDetail storage _gameConsumeRecord = gameConsumeRecord[
            _game
        ];
        return (
            _consumeRecord.cenoConsumed,
            _consumeRecord.gasUsed,
            _gameConsumeRecord.cenoConsumed,
            _gameConsumeRecord.gasUsed
        );
    }

    function getPlayerConsumeRecordLastCycle(
        address _player,
        address _game
    )
        public
        view
        returns (
            uint256 cenoConsumed,
            uint256 gasUsed,
            uint256 cenoConsumedTotal,
            uint256 gasUsedTotal
        )
    {
        ConsumeRecordDetail storage _consumeRecord = consumeRecord[_player][
            _game
        ];
        ConsumeRecordDetail storage _gameConsumeRecord = gameConsumeRecord[
            _game
        ];
        return (
            _consumeRecord.cenoConsumed,
            _consumeRecord.gasUsed,
            _gameConsumeRecord.cenoConsumed,
            _gameConsumeRecord.gasUsed
        );
    }
}
