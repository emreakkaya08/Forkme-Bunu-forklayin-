//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./VersionUpgradeable.sol";

contract GameCoefficientBallot is
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
    bytes32 public constant BALLOT_ROLE = keccak256("BALLOT_ROLE");

    address[] private game;
    uint256[] private coefficient;
    mapping(address => uint256) private gameCoefficient;
    uint256 private totalCoefficient;

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
        _grantRole(BALLOT_ROLE, msg.sender);
    }

    function _setGameCoefficient(
        address[] memory _game,
        uint256[] memory _gameCoefficient
    ) internal {
        require(_game.length == _gameCoefficient.length, "Length mismatch");

        uint256 _totalCoefficient;
        for (uint256 i = 0; i < _game.length; i++) {
            require(_game[i] != address(0), "Invalid game address");
            require(!_game[i].isContract(), "Invalid game address");
            require(_gameCoefficient[i] > 0, "Invalid game coefficient");
            _totalCoefficient += _gameCoefficient[i];
            gameCoefficient[_game[i]] = _gameCoefficient[i];
        }

        game = _game;
        coefficient = _gameCoefficient;
        totalCoefficient = _totalCoefficient;

        emit SetGameCoefficient(game, coefficient, totalCoefficient);
    }

    function startBallot(
        address[] memory _game,
        uint256[] memory _gameCoefficient
    ) public onlyRole(BALLOT_ROLE) {
        _setGameCoefficient(_game, _gameCoefficient);
    }

    function getGameCoefficient(
        address _game,
        uint64 _timestamp
    )
        public
        view
        returns (uint256 _gameCoefficient, uint256 _totalCoefficient)
    {
        _timestamp;

        _gameCoefficient = gameCoefficient[_game];
        _totalCoefficient = totalCoefficient;
    }
}
