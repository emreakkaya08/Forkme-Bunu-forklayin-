import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';


describe('PlayerPaymentSplitter', async () => {
    
    let tokenCofferPaymentSplitterContract: Contract;
    let zoicToken: Contract;
    let playerCoffer: Contract;
    let cenoToken: Contract;
    let playerPaymentSplitterContract: Contract;
    let tokenZoicCoffer: Contract;
    
    beforeEach(async () => {
        
        const ZOICTokenCoffer = await ethers.getContractFactory('TokenCoffer');
        tokenZoicCoffer = await upgrades.deployProxy(ZOICTokenCoffer, []);
        await tokenZoicCoffer.deployed();
        
        const TokenZOICContract = await ethers.getContractFactory('TokenZOIC');
        zoicToken = await upgrades.deployProxy(TokenZOICContract, [
            playerPaymentSplitterContract.address,
        ]);
        await zoicToken.deployed();
        console.log('TokenZOIC balanceOf:', await zoicToken.balanceOf( playerPaymentSplitterContract.address));
        
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
    
    
    it('PlayerPaymentSplitter: paymentSplit test', async () => {
        
        const [owner] = await ethers.getSigners();
        console.log('playerCoffer balanceOf:', await zoicToken.balanceOf(playerCoffer.address));
        await playerPaymentSplitterContract.connect(owner).paymentSplit();
        console.log('playerCoffer balanceOf:', await zoicToken.balanceOf(playerCoffer.address));
        expect(await playerPaymentSplitterContract.getZOICAward()).to.equal(ethers.utils.parseEther('100'));
        
    });
    
    it('PlayerPaymentSplitter: releaseZOIC test', async () => {
        
        const [owner] = await ethers.getSigners();
        await playerPaymentSplitterContract.releaseZOIC();
        expect(await zoicToken.balanceOf(playerCoffer.address)).to.equal(ethers.utils.parseEther('100'));
        
    });
    
});
