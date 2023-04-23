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

  const year1VestingByTimeWallet = await getContract(
    'VestingByTimeWallet',
    ContractDeployAddress.Year1VestingByTimeWallet
  );
  const balance = await year1VestingByTimeWallet.balanceOf(
    ContractDeployAddress.TokenZOIC
  );
  if (balance.gt(0)) {
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

  //grant minter role to default caller
  const tx = await zoicTokenCoffer.grantRole(
    ethers.utils.id('WITHDRAW'),
    ContractDeployAddress.Year1VestingByTimeWallet
  );
  const receipt = await tx.wait();
  console.log(receipt);

  const txWithdraw = zoicTokenCoffer
    .connect(ContractDeployAddress.Year1VestingByTimeWallet)
    .withdrawERC20(
      ContractDeployAddress.TokenZOIC,
      year1VestingByTimeWallet.address,
      amount
    );
  const receiptWithdraw = await txWithdraw.wait();
  console.log(receiptWithdraw);
  console.log(
    'the first year vesting wallet balance',
    await year1VestingByTimeWallet.balanceOf(ContractDeployAddress.TokenZOIC)
  );
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
