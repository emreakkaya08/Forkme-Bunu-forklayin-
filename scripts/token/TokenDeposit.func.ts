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

async function addExchangeRate() {
  const contract = await getContract();

  //grant minter role to default caller
  const rate = 1;
  const tx = await contract.addExchangeRate(
    ContractDeployAddress.XYGameUSDT,
    rate
  );
  const receipt = await tx.wait();
  console.log(`TokenDeposit add addExchangeRate usdt ${rate}`, 'done!');
}

// async function grantRole() {
//   const contract = await getContract();

//   //grant minter role to default caller
//   const tx = await contract.grantRole(
//     ethers.utils.id('ADMIN'),
//     '0xbaeFe32bc1636a90425AcBCC8cfAD1b0507eCdE1'
//   );
//   const receipt = await tx.wait();
//   console.log(receipt);
//   console.log('DepositToken get role of Mint X', 'done!');
// }

async function main() {
  await addExchangeRate();
  // await grantRole();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
