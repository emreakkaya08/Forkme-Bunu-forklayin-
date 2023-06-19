//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import "../core/contract-upgradeable/VersionUpgradeable.sol";
import "./GameAccount.sol";

contract GameFactory is
    Initializable,
    ReentrancyGuardUpgradeable,
    AccessControlEnumerableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable,
    VersionUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    event GameRegistered(address indexed caller, address indexed gameAccount);

    address public gameAccountTemplate;
    mapping(address => address) public gameAccounts;
    uint256 private _totalRegistered;

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

    function initialize(address template_) public initializer {
        __AccessControlEnumerable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __VersionUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        gameAccountTemplate = template_;
    }

    function register(
        string memory gameName_
    ) public whenNotPaused nonReentrant {
        address caller = _msgSender();
        require(gameAccounts[caller] == address(0), "already registered");

        GameAccount gameAccount = GameAccount(
            ClonesUpgradeable.cloneDeterministic(
                gameAccountTemplate,
                keccak256(abi.encode(caller))
            )
        );

        gameAccount.initialize(gameName_);

        gameAccounts[caller] = address(gameAccount);
        _totalRegistered += 1;

        emit GameRegistered(caller, address(gameAccount));
    }

    function getGameAccount() public view returns (address) {
        return gameAccounts[_msgSender()];
    }

    function totalRegistered() public view returns (uint256) {
        return _totalRegistered;
    }
}
