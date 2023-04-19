//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../core/contract-upgradeable/VersionUpgradeable.sol";

/**
 * @title YToken
 * @author
 * @notice YToken is a ERC20 token with pausable, upgradable, and versionable features.
 * 总数为 1000000000000000000000000000, 18位小数
 */
contract YToken is
    Initializable,
    PausableUpgradeable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    VersionUpgradeable,
    ERC20Upgradeable
{
    // the role that can pause the contract
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    // the role that used for upgrading the contract
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    // the role that used for mint Y
    bytes32 public constant Y_ADMIN_ROLE = keccak256("Y_ADMIN_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __ERC20_init("YToken", "Y");
        _mint(msg.sender, 100000000 * (10 ** decimals())); //指定总数 1 亿
        __Pausable_init();
        __AccessControl_init();
        __VersionUpgradeable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(Y_ADMIN_ROLE, msg.sender);
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
}
