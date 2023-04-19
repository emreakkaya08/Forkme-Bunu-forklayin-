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
        expect(await contract.decimals()).to.equal(18);
    });

    it("should allow minting by MINT_X_ROLE", async function () {
        const amount = ethers.utils.parseEther("100");
        const [mintXRole] = await ethers.getSigners();
        await contract.connect(mintXRole).mint(amount);
        console.log("mintXRole: ", await mintXRole.getAddress());
        console.log("contract balanceof: ", await contract.balanceOf(await mintXRole.getAddress()));
        expect(await contract.balanceOf(await mintXRole.getAddress())).to.equal(amount);
    });
});

