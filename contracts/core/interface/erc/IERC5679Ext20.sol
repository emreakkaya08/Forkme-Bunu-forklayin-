//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// The EIP-165 identifier of this interface is 0xd0017968
interface IERC5679Ext20 {
    function mint(address _to, uint256 _amount, bytes calldata _data) external;

    function burn(
        address _from,
        uint256 _amount,
        bytes calldata _data
    ) external;
}
