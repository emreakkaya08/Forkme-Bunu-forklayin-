import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";

describe("NFTForRewardPoints", async () => {
  let contract: Contract;

  beforeEach(async () => {
    const NFTForRewardPointsContract = await ethers.getContractFactory(
      "NFTForRewardPoints"
    );
    contract = await upgrades.deployProxy(NFTForRewardPointsContract, [
      "NFTForRewardPoints",
      "NRP",
      3,
    ]);
    await contract.deployed();
  });

  it("NFTForRewardPoints Test", async () => {
    expect(contract).to.be.instanceOf(Contract);
    expect(await contract.name()).to.equal("NFTForRewardPoints");
    expect(await contract.symbol()).to.equal("NRP");
  });

  it("NFTForRewardPoints mint", async () => {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    console.log("contract.address", contract.address);

    const tokenId1 = 11001;
    const revertedWith = `AccessControl: account ${ethers.utils
      .getAddress(addr1.address)
      .toLowerCase()} is missing role ${ethers.utils.id("MINTER_ROLE")}`;
    await expect(
      contract.connect(addr1).safeMint(owner.address, tokenId1)
    ).to.be.revertedWith(revertedWith);

    contract.grantRole(ethers.utils.id("MINTER_ROLE"), addr1.address);

    expect(await contract.connect(addr1).safeMint(owner.address, tokenId1))
      .to.emit(contract, "Transfer")
      .withArgs(ethers.constants.AddressZero, owner.address, tokenId1);

    expect(await contract.balanceOf(owner.address)).to.equal(1);
    expect(await contract.ownerOf(tokenId1)).to.equal(owner.address);
    expect(await contract.totalSupply()).to.equal(1);
    expect(await contract.tokenByIndex(0)).to.equal(tokenId1);

    const tokenId2 = 11002;

    //expect an address can only mint one token
    await expect(
      contract.connect(addr1).safeMint(owner.address, tokenId2)
    ).to.be.revertedWith("already minted");

    expect(await contract.connect(addr1).safeMint(addr1.address, tokenId2))
      .to.emit(contract, "Transfer")
      .withArgs(ethers.constants.AddressZero, addr1.address, tokenId2);
    expect(await contract.balanceOf(addr1.address)).to.equal(1);

    const tokenId3 = 11003;
    expect(await contract.connect(addr1).safeMint(addr2.address, tokenId3))
      .to.emit(contract, "Transfer")
      .withArgs(ethers.constants.AddressZero, addr2.address, tokenId3);
    expect(await contract.balanceOf(addr2.address)).to.equal(1);

    await expect(
      contract.connect(addr1).safeMint(addr3.address, tokenId3)
    ).to.be.revertedWith("max mint amount reached");
  });
});
