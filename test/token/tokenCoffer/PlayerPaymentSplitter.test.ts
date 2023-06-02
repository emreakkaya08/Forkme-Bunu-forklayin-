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
        
        // random address
        // 0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B  assume to be game Burger Challenge
        // 0x1Db3439a222C519ab44bb1144fC28167b4Fa6EE6  assume to be game Save the Princess
        let burgerChallenge = ethers.utils.getAddress("0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B");
        let saveThePrincess = ethers.utils.getAddress("0x1Db3439a222C519ab44bb1144fC28167b4Fa6EE6");
        // random address
        // 0x220866B1A2219f40e72f5c628B65D54268cA3A9D  assume to be player Link
        // 0xD04daa65144b97F147fbc9a9B45E741dF0A28fd7  assume to be player Zelda
        let link = ethers.utils.getAddress("0x220866B1A2219f40e72f5c628B65D54268cA3A9D");
        let zelda = ethers.utils.getAddress("0xD04daa65144b97F147fbc9a9B45E741dF0A28fd7");
        
        
        const [owner] = await ethers.getSigners();
        
        await gamePool.connect(owner).refreshApprove(zoicToken.address, playerPaymentSplitterContract.address);
        console.log("the allowance of game pool that splitter got", await zoicToken.allowance(gamePool.address, playerPaymentSplitterContract.address));
        expect(await zoicToken.allowance(gamePool.address, playerPaymentSplitterContract.address)).to.equal(ethers.utils.parseEther("1"));
        
        await gameCoefficientBallot.startBallot([burgerChallenge, saveThePrincess], [20, 80]);
        await gameCoefficientBallot.getGameCoefficient(burgerChallenge).then(([gameCoefficient, totalCoefficient]) => {
            expect(gameCoefficient).to.equal(20);
        });
        await gameCoefficientBallot.getGameCoefficient(saveThePrincess).then(([gameCoefficient, totalCoefficient]) => {
            expect(gameCoefficient).to.equal(80);
        });
        
        await playerConsumeRecord.connect(owner).updatePlayerRecord(link, saveThePrincess, 10, 10);
        await playerConsumeRecord.connect(owner).updatePlayerRecord(zelda, burgerChallenge, 20, 10);
        await playerConsumeRecord.connect(owner).updatePlayerRecord(owner.address, burgerChallenge, 20, 10);
        await playerConsumeRecord.getPlayerConsumeRecordThisCycle(link, saveThePrincess)
            .then(([cenoConsumed, gasUsed, cenoConsumedTotal, gasUsedTotal]) => {
                expect(cenoConsumed).to.equal(10);
                expect(gasUsed).to.equal(10);
                expect(cenoConsumedTotal).to.equal(10);
                expect(gasUsedTotal).to.equal(10);
            });
        await playerConsumeRecord.getPlayerConsumeRecordThisCycle(zelda, burgerChallenge)
            .then(([cenoConsumed, gasUsed, cenoConsumedTotal, gasUsedTotal]) => {
                expect(cenoConsumed).to.equal(20);
                expect(gasUsed).to.equal(10);
                expect(cenoConsumedTotal).to.equal(40);
                expect(gasUsedTotal).to.equal(20);
            });
        await playerConsumeRecord.getPlayerConsumeRecordThisCycle(owner.address, burgerChallenge)
            .then(([cenoConsumed, gasUsed, cenoConsumedTotal, gasUsedTotal]) => {
                expect(cenoConsumed).to.equal(20);
                expect(gasUsed).to.equal(10);
                expect(cenoConsumedTotal).to.equal(40);
                expect(gasUsedTotal).to.equal(20);
            });
        console.log(await playerConsumeRecord.getPlayerConsumeRecordThisCycle(link, saveThePrincess));
        
        expect(await playerPaymentSplitterContract.connect(owner).releasableThisCycle(burgerChallenge)).to.equal(ethers.utils.parseEther("0.32"));
        
        await playerPaymentSplitterContract.connect(owner).claim(burgerChallenge);
        expect(await zoicToken.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("0.32"));
        
    });
    
});
