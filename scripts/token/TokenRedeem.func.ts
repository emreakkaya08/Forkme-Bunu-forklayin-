import { ethers } from 'hardhat';
import { ContractDeployAddress } from '../consts/deploy.address.const';

async function getContract() {
  const contract = await ethers.getContractAt(
    'TokenRedeem',
    ContractDeployAddress.TokenRedeem
  );
  const [owner] = await ethers.getSigners();

  return contract.connect(owner);
}

async function addTokenPair() {
  const redeemToken =
    ContractDeployAddress.USDT ?? ContractDeployAddress.XYGameUSDT;
  const contract = await getContract();
  await contract.addRedeemTokenPair(
    ContractDeployAddress.TokenCENO,
    ContractDeployAddress.TokenZOIC,
    redeemToken,
    9
  );

  console.log(
    `add token pair: 9 * ${ContractDeployAddress.TokenCENO}, 1 * ${ContractDeployAddress.TokenZOIC} to get ${redeemToken}`
  );
}

async function main() {
  await addTokenPair();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
