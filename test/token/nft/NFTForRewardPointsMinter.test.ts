import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";

describe("NFTForRewardPointsMinter", async () => {
  let contract: Contract;
  let contractSilver: Contract;

  beforeEach(async () => {
    const [owner, addr1] = await ethers.getSigners();

    const NFTForRewardPointsMinterContract = await ethers.getContractFactory(
      "NFTForRewardPointsMinter"
    );
    contract = await upgrades.deployProxy(NFTForRewardPointsMinterContract, [
      owner.address,
    ]);
    await contract.deployed();

    const NFTSilverBoxContract = await ethers.getContractFactory(
      "NFTForRewardPoints"
    );
    contractSilver = await upgrades.deployProxy(NFTSilverBoxContract, [
      "CenoZoicPointsSilverBox",
      "CZPS",
      1000,
    ]);
    await contractSilver.deployed();
  });

  it("NFTForRewardPointsMinter Test", async () => {
    expect(contract).to.be.instanceOf(Contract);
    expect(contractSilver).to.be.instanceOf(Contract);
  });

  it("NFTForRewardPointsMinter add token", async () => {
    const [owner, addr1] = await ethers.getSigners();
    await expect(
      contract.connect(owner).addToken(contractSilver.address, 0)
    ).to.be.revertedWith("point limit must be greater than 0");

    expect(await contract.connect(owner).addToken(contractSilver.address, 100))
      .to.be.ok;
  });

  it("NFTForRewardPointsMinter mint", async () => {
    const [owner, addr1] = await ethers.getSigners();
    expect(await contract.connect(owner).addToken(contractSilver.address, 100))
      .to.be.ok;

    contractSilver.grantRole(ethers.utils.id("MINTER_ROLE"), contract.address);

    await expect(
      contract.connect(addr1).safeMint(owner.address, addr1.address, 1001)
    ).to.be.revertedWith("token not supported");

    expect(
      await contract
        .connect(addr1)
        .safeMint(contractSilver.address, addr1.address, 1001)
    )
      .to.emit(contractSilver, "RPNFTMinted")
      .withArgs(contractSilver.address, addr1.address, 1001, 100);

    expect(await contractSilver.totalSupply()).to.equal(1);
    expect(await contractSilver.balanceOf(addr1.address)).to.equal(1);
    expect(await contractSilver.ownerOf(1001)).to.equal(addr1.address);
  });
});
