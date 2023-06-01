import {expect} from 'chai';
import {Contract} from 'ethers';
import {ethers, upgrades} from 'hardhat';


describe('PlayerPaymentSplitter', async () => {
    
    let gamePool: Contract;
    let zoicToken: Contract;
    let playerPaymentSplitterContract: Contract;
    let gameCoefficientBallot: Contract;
    let playerConsumeRecord: Contract;
    
    beforeEach(async () => {
        
        const GamePool = await ethers.getContractFactory('TokenCoffer');
        gamePool = await upgrades.deployProxy(GamePool, []);
        await gamePool.deployed();
        
        const TokenZOICContract = await ethers.getContractFactory('TokenZOIC');
        zoicToken = await upgrades.deployProxy(TokenZOICContract, [gamePool.address,]);
        await zoicToken.deployed();
        console.log('TokenZOIC balanceOf gamePool:', await zoicToken.balanceOf(gamePool.address));
        
        const GameCoefficientBallotContract = await ethers.getContractFactory('GameCoefficientBallot');
        gameCoefficientBallot = await upgrades.deployProxy(GameCoefficientBallotContract, []);
        await gameCoefficientBallot.deployed();
        console.log('GameCoefficientBallot deployed to:', gameCoefficientBallot.address);
        
        const PlayerConsumeRecordContract = await ethers.getContractFactory('PlayerConsumeRecord');
        playerConsumeRecord = await upgrades.deployProxy(PlayerConsumeRecordContract, []);
        await playerConsumeRecord.deployed();
        console.log('PlayerConsumeRecord deployed to:', playerConsumeRecord.address);
        
        const PlayerPaymentSplitterContract = await ethers.getContractFactory('PlayerPaymentSplitter');
        playerPaymentSplitterContract = await upgrades.deployProxy(
            PlayerPaymentSplitterContract, [zoicToken.address, gamePool.address, gameCoefficientBallot.address, playerConsumeRecord.address]);
        await playerPaymentSplitterContract.deployed();
        console.log('PlayerPaymentSplitter deployed to:', playerPaymentSplitterContract.address);
        
    });
    
    
    it('PlayerPaymentSplitter: paymentSplit test', async () => {
        
        const [owner] = await ethers.getSigners();
        
        await gamePool.connect(owner).refreshApprove(zoicToken.address, playerPaymentSplitterContract.address);
        console.log("the allowance of game pool that splitter got", await zoicToken.allowance(gamePool.address, playerPaymentSplitterContract.address));
        
        await gameCoefficientBallot.startBallot();
        
        
        await playerPaymentSplitterContract.connect(owner).claim();
        console.log('after releasing, player balanceOf:', await zoicToken.balanceOf(ethers.utils.getAddress("0x8e675b3B721af441E908aB2597C1BC283A0D1C4d")));
        
    });
    
});
