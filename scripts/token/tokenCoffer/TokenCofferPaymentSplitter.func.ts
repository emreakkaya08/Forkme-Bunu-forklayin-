import { ethers } from 'hardhat';
import { ContractDeployAddress } from '../../consts/deploy.address.const';

async function getContract() {
  const contract = await ethers.getContractAt(
    'TokenCofferPaymentSplitter',
    ContractDeployAddress.TokenCofferPaymentSplitter
  );
  const [owner] = await ethers.getSigners();

  return contract.connect(owner);
}

async function releaseERC20() {
  const contract = await getContract();
  const txGame = await contract.releaseERC20(
    ContractDeployAddress.TokenZOIC,
    ContractDeployAddress.GameTokenCoffer
  );
  const receiptGame = await txGame.wait();

  const txPool = await contract.releaseERC20(
    ContractDeployAddress.TokenZOIC,
    ContractDeployAddress.PoolTokenCoffer
  );
  const receiptPool = await txPool.wait();

  const txVault = await contract.releaseERC20(
    ContractDeployAddress.TokenZOIC,
    ContractDeployAddress.VaultTokenCoffer
  );
  const receiptVault = await txVault.wait();

  const txTeam = await contract.releaseERC20(
    ContractDeployAddress.TokenZOIC,
    ContractDeployAddress.TeamTokenCoffer
  );
  const receiptTeam = await txTeam.wait();
}

async function main() {
  await releaseERC20();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
