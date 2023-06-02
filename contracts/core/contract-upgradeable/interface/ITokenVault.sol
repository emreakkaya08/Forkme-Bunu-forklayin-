//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface ITokenVault {
    event Withdraw(address to, uint256 amount);
    event WithdrawERC20(
        IERC20Upgradeable indexed token,
        address indexed to,
        uint256 amount
    );

    function getNonce() external view returns (uint256);

    function withdrawWithSignature(
        uint256 amount,
        bytes memory signature
    ) external;

    function withdrawERC20WithSignature(
        IERC20Upgradeable token,
        uint256 amount,
        bytes memory signature
    ) external;

    function withdraw(address payable to, uint256 amount) external;

    function withdrawERC20(
        IERC20Upgradeable token,
        address to,
        uint256 value
    ) external;
}
