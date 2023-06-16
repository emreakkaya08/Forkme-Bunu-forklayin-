import { ethers } from "hardhat";
import { ContractDeployAddress } from "../../consts/deploy.address.const";

async function getContract() {
  const contract = await ethers.getContractAt(
    "NFTForRewardPointsMinter",
    ContractDeployAddress.TokenCENO
  );
  const [owner] = await ethers.getSigners();

  return contract.connect(owner);
}

async function addToken(minter: any) {
  // TODO confirm points amount
  await minter.addToken(
    ContractDeployAddress.NFTForRewardPointsSilverBox,
    3000
  );

  await minter.addToken(
    ContractDeployAddress.NFTForRewardPointsGoldenBox,
    20000
  );

  await minter.addToken(
    ContractDeployAddress.NFTForRewardPointsAmethystBox,
    60000
  );

  console.log("add token success");
}

async function getRoleOfNFT(minter: any, address: string) {
  const contract = await ethers.getContractAt("NFTForRewardPoints", address);
  const [owner] = await ethers.getSigners();

  contract
    .connect(owner)
    .grantRole(ethers.utils.id("MINTER_ROLE"), minter.address);
}

async function main() {
  const minter = await getContract();

  await addToken(minter);

  await getRoleOfNFT(minter, ContractDeployAddress.NFTForRewardPointsSilverBox);
  await getRoleOfNFT(minter, ContractDeployAddress.NFTForRewardPointsGoldenBox);
  await getRoleOfNFT(
    minter,
    ContractDeployAddress.NFTForRewardPointsAmethystBox
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
