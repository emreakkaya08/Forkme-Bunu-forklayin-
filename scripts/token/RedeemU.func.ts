import { ethers } from 'hardhat';
import { ContractDeployAddress } from '../consts/deploy.address.const';

async function getContract() {
  const contract = await ethers.getContractAt(
    'RedeemU',
    ContractDeployAddress.RedeemU
  );
  const [owner] = await ethers.getSigners();

  return contract.connect(owner);
}

async function setTokens() {
  const contract = await getContract();

  const tx = await contract.setTokens(
    ContractDeployAddress.XToken,
    ContractDeployAddress.YToken
  );
  const receipt = await tx.wait();
  console.log(`RedeemU setTokens`, 'done!');
}

async function main() {
  await setTokens();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
