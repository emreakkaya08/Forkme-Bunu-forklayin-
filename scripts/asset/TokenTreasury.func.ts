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
  const usdtContract = await ethers.getContractAt(
    ContractDeployAddress.USDT ? 'xx' : 'XYGameUSDT',
    ContractDeployAddress.USDT ?? ContractDeployAddress.XYGameUSDT
  );

  const balance = await usdtContract.balanceOf(
    ContractDeployAddress.TokenTreasury
  );
  console.log('TokenTreasury USDT balance', balance.toString());

  const contract = await getContract();
  const [owner] = await ethers.getSigners();

  const txGrant = await contract.grantRole(
    ethers.utils.id('APPROVE_ERC20'),
    owner.address
  );
  const receiptGrant = await txGrant.wait();

  const tx = await contract.approve(
    usdtContract.address,
    ContractDeployAddress.TokenRedeem,
    balance
  );
  const receipt = await tx.wait();
  console.log(receipt);
  console.log('TokenRedeem get approved of USDT', 'done!');
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
