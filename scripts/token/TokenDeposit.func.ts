import { ethers } from 'hardhat';
import { ContractDeployAddress } from '../consts/deploy.address.const';

async function getContract() {
  const contract = await ethers.getContractAt(
    'TokenDeposit',
    ContractDeployAddress.TokenDeposit
  );
  const [owner] = await ethers.getSigners();
  return contract.connect(owner);
}

async function setTreasury() {
  // const contract = await getContract();
  // contract.setTreasury(ContractDeployAddress.Treasury);
  console.log('DepositToken setTreasury', 'done!');
//  console.log('DepositToken setTreasury', await contract.getTreasury());
}

async function main() {
  await setTreasury();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
