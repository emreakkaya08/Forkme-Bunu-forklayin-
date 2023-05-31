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

async function approveTokenRedeem() {
  const withdrawErc20Role = ethers.utils.id('WITHDRAW_ERC20');

  const contract = await getContract();

  const txGrant = await contract.grantRole(
    withdrawErc20Role,
    ContractDeployAddress.TokenRedeem
  );
  await txGrant.wait();
  console.log('TokenRedeem get WITHDRAW_ERC20 Role', 'done!');
}

async function main() {
  await approveTokenRedeem();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
