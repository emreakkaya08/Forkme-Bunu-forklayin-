// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract XToken is Initializable,AccessControlUpgradeable,UUPSUpgradeable,ERC20Upgradeable {

    //合约所有者
    address private contractOwner;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // 初始化指定代币名称,符号,设置owner地址
    function initialize(string memory name_, string memory symbol_, uint256 initialSupply) public virtual initializer { 
         __ERC20_init(name_, symbol_); 
         contractOwner = msg.sender;//指定合约所有者
         __AccessControl_init();
         __UUPSUpgradeable_init();
         _mint(msg.sender, initialSupply);
     }

    //USDT mint X
    function mintWithUSDT(uint256 amount) public {
        address sender = msg.sender;
        // USDT ERC20 token
        ERC20Upgradeable usdt = ERC20Upgradeable(0xdAC17F958D2ee523a2206206994597C13D831ec7);
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
        IERC20Upgradeable token = IERC20Upgradeable(tokenAddress);
        //获取合约所持有的令牌的余额
        uint256 balance = token.balanceOf(address(this));
        return balance;
    }
    
    // 指定更新权限
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

}