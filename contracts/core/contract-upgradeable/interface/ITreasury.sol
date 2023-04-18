// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface ITreasury {
    function depositERC20(
        IERC20Upgradeable _ERC20Token,
        uint256 amount
    ) external;

    function withdrawERC20(
        IERC20Upgradeable token,
        address to,
        uint256 value
    ) external;

    function getBalance() external view returns (uint256);
}
