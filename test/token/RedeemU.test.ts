import {expect} from "chai";
import {Contract} from 'ethers';
import {ethers, upgrades} from 'hardhat';

describe("RedeemU", () => {
    let redeemU: Contract;
    let mockXToken: Contract;
    let mockYToken: Contract;
    let treasury: Contract;
    let mockUSDT: Contract;

    const WITHDRAW = ethers.utils.solidityKeccak256(['string'], ['WITHDRAW']);

    beforeEach(async () => {

        const XToken = await ethers.getContractFactory('XToken');
        mockXToken = await upgrades.deployProxy(XToken, []);
        await mockXToken.deployed();

        const YToken = await ethers.getContractFactory('YToken');
        mockYToken = await upgrades.deployProxy(YToken, []);
        await mockYToken.deployed();

        const TokenTreasury = await ethers.getContractFactory('TokenTreasury');
        treasury = await upgrades.deployProxy(TokenTreasury, []);
        await treasury.deployed();

        const RedeemU = await ethers.getContractFactory("RedeemU");
        redeemU = await upgrades.deployProxy(RedeemU, [treasury.address]);
        await redeemU.deployed();

        const MockUsdt = await ethers.getContractFactory('StableTokenX');
        mockUSDT = await upgrades.deployProxy(MockUsdt, []);
        await mockUSDT.deployed();
    });

    it("Should set tokens correctly", async () => {
        await redeemU.setTokens(mockXToken.address, mockYToken.address);
        expect(await redeemU.xToken()).to.equal(mockXToken.address);
        expect(await redeemU.yToken()).to.equal(mockYToken.address);
    });

    it("Should reddem ERC20 tokens correctly", async () => {
        const [owner, addr1, addr2] = await ethers.getSigners();
        // 设置roles和tokens
        await redeemU.setTokens(treasury.address, mockXToken.address, mockYToken.address);

        //mockUSDT 先 mint 2000个
        await mockUSDT.mint(owner.address, ethers.utils.parseEther('2000'));
        // 金库先预存 1000USDT
        await mockUSDT.connect(owner).transfer(treasury.address, ethers.utils.parseEther('1000'));

        console.log('treasury USDT balance: ', await mockUSDT.balanceOf(treasury.address));

        //检查金库的USDT余额
        expect(await mockUSDT.balanceOf(treasury.address)).to.equal(ethers.utils.parseEther('1000'));

        // 赋予  mint权限给 addr1
        await mockXToken.grantRole(ethers.utils.solidityKeccak256(['string'], ['X_ADMIN_ROLE']), addr1.address);

        //addr1 预存 100X 和 100Y
        await mockXToken.connect(addr1).mint(ethers.utils.parseEther('100'));
        //yToken 转账 addr1 100Y
        await mockYToken.connect(owner).transfer(addr1.address, ethers.utils.parseEther('100'));

        //打印 X 和 Y 代币余额
        console.log('X balance: ', await mockXToken.balanceOf(addr1.address));
        console.log('Y balance: ', await mockYToken.balanceOf(addr1.address));

        // addr1向mockXToken和mockYToken分别授予9X,2Y
        await mockXToken.connect(addr1).approve(redeemU.address, ethers.utils.parseEther("9"));
        await mockYToken.connect(addr1).approve(redeemU.address, ethers.utils.parseEther("2"));
        //授权 redeemU 合约可以提取treasury 的 USDT
        await treasury.grantRole(WITHDRAW, redeemU.address);

        // addr1提款9个X代币和2个Y代币, 目前 1X=2Y 此参数是提取 10USDT
        await redeemU.connect(addr1).redeemERC20(ethers.utils.parseEther("9"), mockUSDT.address);

        //打印销毁后 X 和 Y 代币余额
        console.log('burn finshed X balance: ', await mockXToken.balanceOf(addr1.address));
        console.log('burn finshed Y balance: ', await mockYToken.balanceOf(addr1.address));

        // 检查X和Y代币已被销毁
        expect(await mockXToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("91"));
        expect(await mockYToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("98"));

        // 检查用户收到10个USDT
        expect(await mockUSDT.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("10"));

        console.log('redeem finshed treasury USDT balance: ', await mockUSDT.balanceOf(treasury.address));

        // 检查金库的USDT余额
        expect(await mockUSDT.balanceOf(treasury.address)).to.equal(ethers.utils.parseEther("990"));

        // 打印 X 代币总额
        console.log('totalSupply X: ', await mockXToken.totalSupply());
        // 打印 Y 代币总额
        console.log('totalSupply Y: ', await mockYToken.totalSupply());

    });

});