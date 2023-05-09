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
  // const contractZoic = await ethers.getContractAt(
  //   'TokenZOIC',
  //   ContractDeployAddress.TokenZOIC
  // );

  // const balance = await contractZoic.balanceOf(contract.address);
  // const totalReleased = await contract['totalReleased(address)'](
  //   ContractDeployAddress.TokenZOIC
  // );

  // const totalReceived: BigNumber = balance.add(totalReleased);
  // const released: BigNumber = await contract['released(address,address)'](
  //   ContractDeployAddress.TokenZOIC,
  //   ContractDeployAddress.GameTokenCoffer
  // );
  // const totalShares: BigNumber = await contract['totalShares()']();
  // const shares: BigNumber = await contract['shares(address)'](
  //   ContractDeployAddress.GameTokenCoffer
  // );

  // const amount = totalReceived.mul(shares).div(totalShares).sub(released);

  // console.log(
  //   'balance',
  //   ethers.utils.formatEther(totalShares),
  //   ethers.utils.formatEther(shares),
  //   ethers.utils.formatEther(amount),
  //   ethers.utils.formatEther(totalReceived),
  //   ethers.utils.formatEther(released)
  // );

  try {
    const txGame = await contract.releaseERC20(
      ContractDeployAddress.TokenZOIC,
      ContractDeployAddress.GameTokenCoffer
    );
    const receiptGame = await txGame.wait();
    console.log('receiptGame', receiptGame);
  } catch (error) {
    console.log('nothing to release to game coffer');
  }

  try {
    const txPool = await contract.releaseERC20(
      ContractDeployAddress.TokenZOIC,
      ContractDeployAddress.PoolTokenCoffer
    );
    const receiptPool = await txPool.wait();
  } catch (error) {
    console.log('nothing to release to pool coffer');
  }

  try {
    const txVault = await contract.releaseERC20(
      ContractDeployAddress.TokenZOIC,
      ContractDeployAddress.VaultTokenCoffer
    );
    const receiptVault = await txVault.wait();
  } catch (error) {
    console.log('nothing to release to vault coffer');
  }

  try {
    const txTeam = await contract.releaseERC20(
      ContractDeployAddress.TokenZOIC,
      ContractDeployAddress.TeamTokenCoffer
    );
    const receiptTeam = await txTeam.wait();
  } catch (error) {
    console.log('nothing to release to team coffer');
  }
}

async function main() {
  // await releaseERC20();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
