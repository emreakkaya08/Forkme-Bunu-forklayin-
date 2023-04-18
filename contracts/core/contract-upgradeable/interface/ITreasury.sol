// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITreasury {
    function depositERC20(uint256 amount) external;
    function withdrawERC20(uint256 amount) external;
    function getBalance() external view returns (uint256);
}