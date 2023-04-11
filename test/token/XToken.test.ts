import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';
import { Signer } from "ethers";


describe("XToken", function () {
    let owner: Signer;
    let pauser: Signer;
    let upgrader: Signer;
    let mintXRole: Signer;
    let burnXRole: Signer;
    let contract: Contract;

    beforeEach(async function () {
        [owner, pauser, upgrader, mintXRole, burnXRole] = await ethers.getSigners();
        const XTokenFactory = await ethers.getContractFactory("XToken", owner);

        contract = await upgrades.deployProxy(XTokenFactory);
        await contract.deployed();
    });

    it("should have correct name and symbol", async function () {
        expect(await contract.name()).to.equal("XToken");
        expect(await contract.symbol()).to.equal("X");
    });

    it("should have correct decimals", async function () {
        expect(await contract.decimals()).to.equal(18);
    });

    it("should allow minting by MINT_X_ROLE", async function () {
        const amount = ethers.utils.parseEther("100");
        const [mintXRole] = await ethers.getSigners();
        await contract.connect(mintXRole).continueMinting(amount);
        expect(await contract.balanceOf(await mintXRole.getAddress())).to.equal(amount);
    });

    it("should allow burning by BURN_X_ROLE", async function () {
        const amount = ethers.utils.parseEther("100");
        const [mintXRole] = await ethers.getSigners();
        await contract.connect(mintXRole).continueMinting(amount);
        console.log('mint 100 balanceof :' + await contract.balanceOf(await mintXRole.getAddress()));

        await contract.connect(mintXRole).burn(amount);
        console.log('burn 100 balanceof :' + await contract.balanceOf(await mintXRole.getAddress()));
        expect(await contract.balanceOf(await mintXRole.getAddress())).to.equal(0);
    });

    it("should allow transfer of tokens", async function () {
        const amount = ethers.utils.parseEther("100");
        const [mintXRole, burnXRole] = await ethers.getSigners();
        await contract.connect(mintXRole).continueMinting(amount);

        await contract.connect(mintXRole).transfer(await burnXRole.getAddress(), amount);
        expect(await contract.balanceOf(await mintXRole.getAddress())).to.equal(0);
        expect(await contract.balanceOf(await burnXRole.getAddress())).to.equal(amount);
    });

    it("should allow approval and transfer of tokens", async function () {
        const amount = ethers.utils.parseEther("100");
        const [mintXRole, burnXRole, owner] = await ethers.getSigners();

        await contract.connect(mintXRole).continueMinting(amount);
        await contract.connect(mintXRole).approve(await burnXRole.getAddress(), amount);
        await contract.connect(burnXRole).transferFrom(await mintXRole.getAddress(), await owner.getAddress(), amount);
        expect(await contract.balanceOf(await mintXRole.getAddress())).to.equal(0);
        expect(await contract.balanceOf(await owner.getAddress())).to.equal(amount);
    });

    it("should allow pausing and unpausing by PAUSER_ROLE", async function () {
        const [pauser] = await ethers.getSigners();
        await contract.connect(pauser).pause();
        expect(await contract.paused()).to.equal(true);
        await contract.connect(pauser).unpause();
        expect(await contract.paused()).to.equal(false);
    });
});

