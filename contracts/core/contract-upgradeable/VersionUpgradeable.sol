// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

contract VersionUpgradeable is Initializable, ContextUpgradeable {
    function __VersionUpgradeable_init() internal onlyInitializing {
        __VersionUpgradeable_init_unchained();
    }

    function __VersionUpgradeable_init_unchained() internal onlyInitializing {}

    /**
     * @dev Returns the version of the contract.
     */
    function version() public pure returns (uint256) {
        return _version();
    }

    /**
     * @dev Returns the version of the contract.
     */
    function _version() internal pure virtual returns (uint256) {
        return 1;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
