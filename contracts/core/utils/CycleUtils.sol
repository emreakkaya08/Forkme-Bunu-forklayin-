//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

library CycleUtils {
    
    uint public constant EMISSION_DAY = 86400;
    function isInThisCycle(uint64 _timestamp) public pure returns (bool _isInThisCycle) {
       _isInThisCycle = true;
       _timestamp;
    }
    
}