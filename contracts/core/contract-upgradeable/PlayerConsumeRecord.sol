//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./VersionUpgradeable.sol";
import "../../core/utils/CycleUtils.sol";

contract gameCoefficientBallot is
    Initializable,
    AccessControlEnumerableUpgradeable,
    UUPSUpgradeable,
    VersionUpgradeable
{
    using AddressUpgradeable for address;

    event SetGameCoefficient(
        address[] game,
        uint256[] coefficient,
        uint256 totalCoefficient
    );

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");

    mapping(address => address[]) private gamePlayedLastCycle;
    mapping(address => address[]) private gamePlayedThisCycle;

    struct consumeRecordDetail {
        uint256 cenoConsumed;
        uint256 gasUsed;
    }
    mapping(address => consumeRecordDetail) private consumeRecord;

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
        uint64 _timestamp,
        address _player,
        uint256 _cenoConsumed,
        uint256 _gasUsed
    ) internal {
        require(_timestamp > 0, "Invalid timestamp");
        require(_cenoConsumed > 0, "Invalid cenoConsumed");
        require(_gasUsed > 0, "Invalid gasUsed");

        consumeRecordDetail storage _consumeRecordDetail = consumeRecord[
            _player
        ];
        _consumeRecordDetail.cenoConsumed += _cenoConsumed;
        _consumeRecordDetail.gasUsed += _gasUsed;
    }

    function _updatePlayerGameRecord(
        uint64 _timestamp,
        address _player,
        address _gamePlayed
    ) internal {
        require(_timestamp > 0, "Invalid timestamp");
        require(_gamePlayed != address(0), "Invalid gamePlayed");

        address[] storage _gamePlayedLastCycle = gamePlayedLastCycle[_player];
        _gamePlayedLastCycle[_gamePlayedLastCycle.length] = _gamePlayed;
    }

    function updatePlayerRecord(
        uint64 _timestamp,
        address _player,
        address _gamePlayed,
        uint256 _cenoConsumed,
        uint256 _gasUsed
    ) public onlyRole(RECORDER_ROLE) {
        _updatePlayerRecord(_timestamp, _player, _cenoConsumed, _gasUsed);
        _updatePlayerGameRecord(_timestamp, _player, _gamePlayed);
    }

    function getPlayerConsumeRecord(
        address _player
    ) public view returns (uint256 cenoConsumed, uint256 gasUsed) {
        consumeRecordDetail storage _consumeRecord = consumeRecord[_player];
        return (_consumeRecord.cenoConsumed, _consumeRecord.gasUsed);
    }

    function getPlayerGameRecord(
        address _player
    ) public view returns (address[] memory _gamePlayed) {
        _gamePlayed = gamePlayedThisCycle[_player];
    }

}
