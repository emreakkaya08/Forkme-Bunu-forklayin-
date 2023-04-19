//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../core/contract-upgradeable/VersionUpgradeable.sol";

contract Greeter is
    Initializable,
    PausableUpgradeable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    VersionUpgradeable
{
    string private greeting;

    event GreetingChanged(address from, string _greeting);

    // the role that can pause the contract
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    // the role that used for upgrading the contract
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    // the role that used for setting the greeting
    bytes32 public constant SET_GREETING_ROLE = keccak256("SET_GREETING_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _greeting) public initializer {
        greeting = _greeting;
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(SET_GREETING_ROLE, msg.sender);
    }

    /**
     * Returns the version of the contract.
     */
    function _version() internal pure virtual override returns (uint256) {
        return 1;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function greet() public view returns (string memory) {
        return greeting;
    }

    function setGreeting(
        string memory _greeting
    ) public whenNotPaused onlyRole(SET_GREETING_ROLE) {
        greeting = _greeting;

        emit GreetingChanged(msg.sender, _greeting);
    }
}
