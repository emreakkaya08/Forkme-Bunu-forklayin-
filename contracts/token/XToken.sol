// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract XToken is ERC20 {

    //合约所有者
    address private contractOwner;

    // 指定代币名称,符号
    constructor() ERC20("XToken", "X") {
        contractOwner = msg.sender;
    }

    //USDT mint X
    function mintWithUSDT(uint256 amount,address sender) public {
        // USDT ERC20 token
        ERC20 usdt = ERC20(0xdAC17F958D2ee523a2206206994597C13D831ec7);
        // 检查调用者已经授权合约地址来管理足够数量的USDT代币
        uint256 allowance = usdt.allowance(sender, address(this));
        // 检查是否已批准此合同使用USDT
        require(allowance >= amount, "USDT allowance not enough");

        // 检查是否有足够的余额 mint
        uint256 balance = usdt.balanceOf(sender);
        require(balance >= amount, "Insufficient USDT balance");

        // 将USDT从发送方转移到此合约
        bool usdtTransferSuccess = usdt.transferFrom(sender, address(this), amount);
        require(usdtTransferSuccess, "USDT transfer failed");
        // 将相应数量的X铸币给发送方
        _mint(sender, amount);
    }

    function owner() public view returns (address) {
        return contractOwner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner(), "Only contract owner can call this function");
        _;
    }

    // 允许任何人检查合约所持有的任何ERC20令牌的余额
    function checkERC20Balance(address tokenAddress) public view returns (uint256) {
        ERC20 token = ERC20(tokenAddress);
        //获取合约所持有的令牌的余额
        uint256 balance = token.balanceOf(address(this));
        return balance;
    }
}


