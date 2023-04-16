import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';
import { Signer } from "ethers";


describe("YToken", function () {
    let owner: Signer;
    let pauser: Signer;
    let upgrader: Signer;
    let contract: Contract;

    beforeEach(async function () {
        [owner, pauser, upgrader] = await ethers.getSigners();
        const YTokenFactory = await ethers.getContractFactory("YToken", owner);

        contract = await upgrades.deployProxy(YTokenFactory);
        await contract.deployed();
    });

    it("should have correct name and symbol", async function () {
        expect(await contract.name()).to.equal("YToken");
        expect(await contract.symbol()).to.equal("Y");
        expect(await contract.decimals()).to.equal(18);
    });
});

