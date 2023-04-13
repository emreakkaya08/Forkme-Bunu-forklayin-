import { ethers } from 'hardhat';
import { ContractDeployAddress } from '../consts/deploy.address.const';

async function getContract() {
  const contract = await ethers.getContractAt(
    'StableTokenX',
    ContractDeployAddress.StableTokenX
  );
  const [owner] = await ethers.getSigners();

  return contract.connect(owner);
}

async function grantRole() {
  const contract = await getContract();

  //grant minter role to default caller
  const tx = await contract.grantRole(
    ethers.utils.id('MINTER_ROLE'),
    ContractDeployAddress.TokenDeposit
  );
  const receipt = await tx.wait();
  console.log(receipt);
  console.log('DepositToken get role of Mint X', 'done!');
}

async function main() {
  // console.log('contractAddress', ContractDeployAddress);
  await grantRole();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
