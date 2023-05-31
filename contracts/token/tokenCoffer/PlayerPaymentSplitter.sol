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

    event TransferZOICToGame(
        address indexed game,
        uint256 coefficient,
        uint256 amount
    );
    event TransferZOICToPlayer(
        address indexed player,
        uint256 poof,
        uint256 amount
    );
    event WithDrawZOIC(address indexed player, uint256 amount);

    IERC20Upgradeable private tokenZOIC;
    GameCoefficientBallot private gameCoefficientBallot;
    PlayerConsumeRecord private playerConsumeRecord;

    address private gamePool;

    mapping(address => uint256) private playerAwarded;
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
        address[] _game,
        uint64 _timestamp
    )
        internal
        returns (uint256[] memory coefficient, uint256 totalCoefficient)
    {
        (coefficient, totalCoefficient) = gameCoefficientBallot
            .getGameCoefficient(_game, _timestamp);
    }

    function _getPlayerPoofThisCycle(
        address player,
        uint64 timestamp
    ) internal returns (uint256 totalPoof, uint256 playerPoof) {}

    function releaseableThisCycle() public returns (uint256 releasable) {
        uint64 _timestamp = block.timestamp;
        address _player = msg.sender;

        address[] memory _gamePlayed = playerConsumeRecord.getPlayerGameRecord(
            _player,
            _timestamp
        );

        (
            uint256[] memory coefficient,
            uint256 totalCoefficient
        ) = _getGameCoefficientThisCycle(_gamePlayed, _timestamp);
    }

    function releaseZOIC() public whenNotPaused {
        uint256 amount = playerAwarded[msg.sender];
        require(amount > 0, "No ZOIC");

        uint256 releasable = SafeMathUpgradeable.sub(
            playerAwarded[msg.sender],
            playerWithdrawn[msg.sender]
        );
        require(releasable > 0, "No ZOIC to withdraw");

        playerWithdrawn[msg.sender] = SafeMathUpgradeable.add(
            playerWithdrawn[msg.sender],
            releasable
        );

        ITokenVault(gamePool).withdrawERC20(tokenZOIC, msg.sender, releasable);

        emit WithDrawZOIC(msg.sender, amount);
    }

    function getZOICAward() public view returns (uint256) {
        require(!blockedList[msg.sender], "You are blocked");

        return playerAwarded[msg.sender];
    }
}
