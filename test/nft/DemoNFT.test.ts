import { ethers } from "hardhat";
import { expect } from "chai";

describe("DemoNFT", function () {
  it("Should mint a new NFT with metadata", async function () {
    const MyNFT = await ethers.getContractFactory("DemoNFT");
    const myNFT = await MyNFT.deploy();
    await myNFT.deployed();

    const tokenId = 1;
    const mockMetaData = "{\"testDemo1\":{\"item1\":[\"pic1\",\"pic2\"],\"other\":{\"age\":10}},\"testDemo2\":{\"h\":null,\"b\":true,\"c\":{}}}";
    const [owner] = await ethers.getSigners();

    await myNFT.connect(owner).mint(owner.address, tokenId, mockMetaData);

    const md = await myNFT.tokenMetadata(tokenId);
    console.log("mint NFT metaData: ", await myNFT.tokenMetadata(tokenId))
    expect(md).to.equal(mockMetaData);

    // updata case 
    const mockMetaDataUpdate = "{\"testDemo1\":{\"item1\":[\"pic3\",\"pic4\"],\"other\":{\"age\":500}},\"testDemo2\":{\"h\":null,\"b\":false,\"c\":{}}}";

    myNFT._setTokenMetadata(tokenId, mockMetaDataUpdate);

    console.log("update NFT metaData: ", await myNFT.tokenMetadata(tokenId))
    expect(await myNFT.tokenMetadata(tokenId)).to.equal(mockMetaDataUpdate);
  });
});