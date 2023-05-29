import {expect} from 'chai';
import {Contract} from 'ethers';
import {ethers, upgrades} from 'hardhat';


describe('PlayerPaymentSplitter', async () => {
    
    let gamePool: Contract;
    let zoicToken: Contract;
    let playerPaymentSplitterContract: Contract;
    let tokenZOICCoffer: Contract;
    
    beforeEach(async () => {
        
        const ZOICTokenCoffer = await ethers.getContractFactory('TokenCoffer');
        tokenZOICCoffer = await upgrades.deployProxy(ZOICTokenCoffer, []);
        await tokenZOICCoffer.deployed();
        
        const GamePool = await ethers.getContractFactory('TokenCoffer');
        gamePool = await upgrades.deployProxy(GamePool, []);
        await gamePool.deployed();
        
        const TokenZOICContract = await ethers.getContractFactory('TokenZOIC');
        zoicToken = await upgrades.deployProxy(TokenZOICContract, [gamePool.address,]);
        await zoicToken.deployed();
        console.log('TokenZOIC balanceOf gamePool:', await zoicToken.balanceOf(gamePool.address));
        
        const PlayerPaymentSplitterContract = await ethers.getContractFactory('PlayerPaymentSplitter');
        playerPaymentSplitterContract = await upgrades.deployProxy(PlayerPaymentSplitterContract, [zoicToken.address, gamePool.address]);
        await playerPaymentSplitterContract.deployed();
        console.log('PlayerPaymentSplitter deployed to:', playerPaymentSplitterContract.address);
        
    });
    
    
    it('PlayerPaymentSplitter: paymentSplit test', async () => {
        
        const [owner] = await ethers.getSigners();
        
        console.log('before splitting, player balanceOf:', await zoicToken.balanceOf(ethers.utils.getAddress("0x8e675b3B721af441E908aB2597C1BC283A0D1C4d")));
        
        await playerPaymentSplitterContract.connect(owner).paymentSplit();
        
        console.log('after splitting, player award:', await playerPaymentSplitterContract.getZOICAward());
        
        await playerPaymentSplitterContract.connect(owner).releaseZOIC();
        console.log('after releasing, player balanceOf:', await zoicToken.balanceOf(ethers.utils.getAddress("0x8e675b3B721af441E908aB2597C1BC283A0D1C4d")));
        
    });
    
});
