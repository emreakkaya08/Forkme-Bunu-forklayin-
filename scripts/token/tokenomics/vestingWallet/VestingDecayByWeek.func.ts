import { ethers } from "hardhat";
import { A_WEEK, TOTAL_RELEASE_WEEKS, getSupplyOf } from "../Tokenomics.const";
import { ZOIC_RELEASE_WEEKLY_DECAY_PERCENT } from "../Tokenomics.const";
import { SupplyDistribution } from "../Tokenomics.const";
import { ContractDeployAddress } from "../../../consts/deploy.address.const";

async function getContract(name: string, address: ContractDeployAddress) {
  const contract = await ethers.getContractAt(name, address);
  const [owner] = await ethers.getSigners();

  return contract.connect(owner);
}

async function addDecayVestingTokenInfo() {
  // add player vesting
  await addVestingTokenInfo(
    ContractDeployAddress.PlayersVestingDecayByWeek,
    SupplyDistribution.Players
  );

  // add devs vesting
  await addVestingTokenInfo(
    ContractDeployAddress.DevsVestingDecayByWeek,
    SupplyDistribution.Devs
  );

  // add staking vesting
  await addVestingTokenInfo(
    ContractDeployAddress.StakingRewardsVestingDecayByWeek,
    SupplyDistribution.StakingRewards
  );

  // add team vesting
  await addVestingTokenInfo(
    ContractDeployAddress.TeamVestingDecayByWeek,
    SupplyDistribution.Team
  );
}

async function getContractWith(address:ContractDeployAddress) {
  const [owner] = await ethers.getSigners();
  const contract = await getContract(
    "VestingScheduleWithTimeBasedDecay",
    address
  );

  return contract.connect(owner);
}

async function addVestingTokenInfo(
  address: ContractDeployAddress,
  supplyDistribution: number
) {
  const [owner] = await ethers.getSigners();

  const contract = await getContract(
    "VestingScheduleWithTimeBasedDecay",
    address
  );

  const txGrantRole = await contract.grantRole(ethers.utils.id("TOKEN_SETTER_ROLE"), owner.address);
  await txGrantRole.wait();
  const tx = await contract
    .addTokenInfo(
      ContractDeployAddress.TokenZOIC,
      TOTAL_RELEASE_WEEKS,
      ZOIC_RELEASE_WEEKLY_DECAY_PERCENT,
      A_WEEK,
      ethers.utils.parseEther(`${getSupplyOf(supplyDistribution)}`)
    );
  await tx.wait();
}

// async function release() {
//   const player = await getContractWith(ContractDeployAddress.PlayersVestingDecayByWeek);
//   const txPlayer = await player['release(address)'](ContractDeployAddress.TokenZOIC);
//   await txPlayer.wait();

//   const dev = await getContractWith(ContractDeployAddress.DevsVestingDecayByWeek);
//   const txDev = await dev['release(address)'](ContractDeployAddress.TokenZOIC);
//   await txDev.wait();

//   const stake = await getContractWith(ContractDeployAddress.StakingRewardsVestingDecayByWeek);
//   const txStake = await stake['release(address)'](ContractDeployAddress.TokenZOIC);
//   await txStake.wait();

//   const team = await getContractWith(ContractDeployAddress.TeamVestingDecayByWeek);
//   const txTeam = await team['release(address)'](ContractDeployAddress.TokenZOIC);
//   await txTeam.wait();
// }

async function main() {
  await addDecayVestingTokenInfo();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
