import { ethers } from 'hardhat';
import { ContractDeployAddress } from '../../consts/deploy.address.const';
import { ONE_YEAR, RELEASE_STEP, VESTING_START_TIME } from './VestingConfig';

async function getContract(name: string, address: ContractDeployAddress) {
  const contract = await ethers.getContractAt(name, address);
  const [owner] = await ethers.getSigners();

  return contract.connect(owner);
}

async function transferZOICToVestingWallet() {
  const startTime = VESTING_START_TIME;
  const endTime = startTime + ONE_YEAR;
  const now = Math.floor(Date.now() / 1000);
  if (now >= endTime) {
    console.log('the time is over, no need to transfer');
    return;
  }

  const zoicToken = await getContract(
    'TokenZOIC',
    ContractDeployAddress.TokenZOIC
  );

  const year1VestingByTimeWallet = await getContract(
    'VestingByTimeWallet',
    ContractDeployAddress.Year1VestingByTimeWallet
  );
  const balance = await zoicToken.balanceOf(
    ContractDeployAddress.Year1VestingByTimeWallet
  );
  if (balance.gt(ethers.utils.parseEther('0'))) {
    console.log(
      'the first year vesting wallet has withdrawn, now balance is',
      balance
    );
    return;
  }

  const amount = ethers.utils.parseEther(RELEASE_STEP[0].toString());

  const zoicTokenCoffer = await getContract(
    'TokenCoffer',
    ContractDeployAddress.ZOICTokenCoffer
  );

  const [owned] = await ethers.getSigners();
  //grant minter role to default caller
  const tx = await zoicTokenCoffer.grantRole(
    ethers.utils.id('WITHDRAW'),
    owned.address
  );
  const receipt = await tx.wait();
  console.log(receipt);

  const txWithdraw = await zoicTokenCoffer
    .connect(owned)
    .withdrawERC20(
      ContractDeployAddress.TokenZOIC,
      year1VestingByTimeWallet.address,
      amount
    );
  const receiptWithdraw = await txWithdraw.wait();
  console.log(receiptWithdraw);
  console.log(
    'the first year vesting wallet balance',
    await zoicToken.balanceOf(ContractDeployAddress.Year1VestingByTimeWallet)
  );
}

async function release() {
  const year1VestingByTimeWallet = await getContract(
    'VestingByTimeWallet',
    ContractDeployAddress.Year1VestingByTimeWallet
  );

  const tx = await year1VestingByTimeWallet['release()']();
  console.log('tx', tx);
  const receipt = await tx.wait();
  console.log(receipt);
}

async function main() {
  await transferZOICToVestingWallet();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
