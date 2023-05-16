//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

contract GameCofficientBallot {
    address gameCofferPaymentSplitter;

    struct map {
        mapping(address => uint256) gameCofficient;
    }

   /*  function getGameCofficient() public returns (map calldata) {
        require(
            msg.sender == gameCofferPaymentSplitter,
            "Only GameCofferPaymentSplitter can call this function"
        );
        map.gameCofficient.push(0, 1);
        return map;
    } */
}
