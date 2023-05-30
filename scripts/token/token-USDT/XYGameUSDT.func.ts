import { ethers } from 'hardhat';
import { ContractDeployAddress } from '../../consts/deploy.address.const';

async function getContract() {
  const contract = await ethers.getContractAt(
    'XYGameUSDT',
    ContractDeployAddress.XYGameUSDT
  );
  const [owner] = await ethers.getSigners();

  return contract.connect(owner);
}

async function transferUSDT() {
  const contract = await getContract();

  const txGrant = await contract.mint(
    ContractDeployAddress.TokenTreasury,
    ethers.utils.parseEther('130')
  );
  await txGrant.wait();
  console.log('TokenTreasury get USDT', 'done!');
}

async function main() {
  await transferUSDT();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
