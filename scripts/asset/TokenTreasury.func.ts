import { ethers } from 'hardhat';
import { ContractDeployAddress } from '../consts/deploy.address.const';

async function getContract() {
  const contract = await ethers.getContractAt(
    'TokenTreasury',
    ContractDeployAddress.TokenTreasury
  );
  const [owner] = await ethers.getSigners();

  return contract.connect(owner);
}

async function grantRoleForWithdraw() {
  const contract = await getContract();

  //grant minter role to default caller
  const tx = await contract.grantRole(
    ethers.utils.id('WITHDRAW'),
    ContractDeployAddress.RedeemU
  );
  const receipt = await tx.wait();
  console.log(receipt);
  console.log('RedeemU get role of withdraw USDT', 'done!');
}

async function main() {
  await grantRoleForWithdraw();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
