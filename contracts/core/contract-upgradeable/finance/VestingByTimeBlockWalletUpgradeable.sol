// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/finance/VestingWalletUpgradeable.sol";

import "../../../providers/datetime/DateTime.sol";

contract VestingByTimeBlockWalletUpgradeable is
    Initializable,
    VestingWalletUpgradeable
{
    /**
     * @dev Set the beneficiary, start timestamp and vesting duration of the vesting wallet.
     */
    function __VestingByTimeBlockWallet_init(
        address beneficiaryAddress,
        uint64 startTimestamp,
        uint64 durationSeconds
    ) internal onlyInitializing {
        __VestingByTimeBlockWallet_init_unchained(
            beneficiaryAddress,
            startTimestamp,
            durationSeconds
        );
    }

    function __VestingByTimeBlockWallet_init_unchained(
        address beneficiaryAddress,
        uint64 startTimestamp,
        uint64 durationSeconds
    ) internal onlyInitializing {
        __VestingWallet_init(
            beneficiaryAddress,
            startTimestamp,
            durationSeconds
        );
    }

    /**
     * @dev Virtual implementation of the vesting formula. This returns the amount vested, as a function of time, for
     * an asset given its total historical allocation.
     */
    function _vestingSchedule(uint256 totalAllocation, uint64 timestamp)
        internal
        view
        virtual
        override
        returns (uint256)
    {
        if (timestamp < start()) {
            return 0;
        } else if (timestamp > start() + duration()) {
            return totalAllocation;
        } else {
            return
                vestingTokens(totalAllocation, timestamp, start(), duration());
        }
    }

    function vestingTokens(
        uint256 totalAllocation,
        uint64 timestamp,
        uint256 _start,
        uint256 _duration
    ) public pure virtual returns (uint256) {
        return (totalAllocation * (timestamp - _start)) / _duration;
    }

    // /**
    //  * @dev This empty reserved space is put in place to allow future versions to add new
    //  * variables without shifting down storage in the inheritance chain.
    //  * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
    //  */
    // uint256[47] private __gap;
}
