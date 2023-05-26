import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';


describe('PlayerPaymentSplitter', async () => {
    
    let tokenCofferPaymentSplitterContract: Contract;
    let zoicToken: Contract;
    let playerCoffer: Contract;
    let cenoToken: Contract;
    let playerPaymentSplitterContract: Contract;
    
    beforeEach(async () => {
        
        const TokenZOICContract = await ethers.getContractFactory('TokenZOIC');
        zoicToken = await upgrades.deployProxy(TokenZOICContract, []);
        await zoicToken.deployed();
        console.log('TokenZOIC deployed to:', zoicToken.address);
        
        const PlayerCofferContract = await ethers.getContractFactory('TokenCoffer');
        playerCoffer = await upgrades.deployProxy(PlayerCofferContract, []);
        await playerCoffer.deployed();
        console.log('PlayerCoffer deployed to:', playerCoffer.address);
        
        const TokenCENOContract = await ethers.getContractFactory('TokenCENO');
        cenoToken = await upgrades.deployProxy(TokenCENOContract, []);
        await cenoToken.deployed();
        console.log('TokenCENO deployed to:', cenoToken.address);
        
        const [owner, gameCoffer, poolCoffer, vaultCoffer, teamCoffer] = await ethers.getSigners();
        const TokenCofferPaymentSplitterContract = await ethers.getContractFactory('TokenCofferPaymentSplitter');
        tokenCofferPaymentSplitterContract = await upgrades.deployProxy(TokenCofferPaymentSplitterContract, [
            [
                poolCoffer.address,
                gameCoffer.address,
                vaultCoffer.address,
                teamCoffer.address,
            ],
            [53, 20, 17, 10],
        ]);
        await tokenCofferPaymentSplitterContract.deployed();
        console.log('TokenCofferPaymentSplitter deployed to:', tokenCofferPaymentSplitterContract.address);
        
        const PlayerPaymentSplitterContract = await ethers.getContractFactory('PlayerPaymentSplitter');
        playerPaymentSplitterContract = await upgrades.deployProxy(PlayerPaymentSplitterContract, [zoicToken.address, playerCoffer.address]);
        await playerPaymentSplitterContract.deployed();
        console.log('PlayerPaymentSplitter deployed to:', playerPaymentSplitterContract.address);
        
    });
    
    it('TokenZOIC Test', async () => {
        expect(zoicToken).to.be.instanceOf(Contract);
    });
    
    it('PlayerCoffer Test', async () => {
        expect(playerCoffer).to.be.instanceOf(Contract);
    });
    
    it('PaymentSplitter Test', async () => {
        expect(tokenCofferPaymentSplitterContract).to.be.instanceOf(Contract);
    });
    
    it('PaymentSplitter: paymentSplit test', async () => {
        
        const [owner] = await ethers.getSigners();
        await tokenCofferPaymentSplitterContract.connect(owner).paymentSplit();
        expect(await tokenCofferPaymentSplitterContract.getZOICAward().to.equal(ethers.utils.parseEther('100')));
        
    });
    
    it('PaymentSplitter: releaseZOIC test', async () => {
        
        const [owner] = await ethers.getSigners();
        await tokenCofferPaymentSplitterContract.releaseZOIC();
        expect(await zoicToken.balanceOf(playerCoffer.address)).to.equal(ethers.utils.parseEther('100'));
        
    });
    
});
