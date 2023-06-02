import { ethers } from "hardhat";
import { ContractDeployAddress } from "scripts/consts/deploy.address.const";
import { A_WEEK, TOTAL_RELEASE_WEEKS, getSupplyOf } from "../Tokenomics.const";
import { ZOIC_RELEASE_WEEKLY_DECAY_PERCENT } from "../Tokenomics.const";
import { SupplyDistribution } from "../Tokenomics.const";
import { TOTAL_SUPPLY_ZOIC } from "../Tokenomics.const";

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

async function addVestingTokenInfo(
  address: ContractDeployAddress,
  supplyDistribution: number
) {
  const [owner] = await ethers.getSigners();

  const contract = await getContract(
    "VestingScheduleWithTimeBasedDecay",
    address
  );

  await contract.grantRole(ethers.utils.id("TOKEN_SETTER_ROLE"), owner.address);
  await contract
    .connect(owner)
    .addTokenInfo(
      ContractDeployAddress.TokenZOIC,
      TOTAL_RELEASE_WEEKS,
      ZOIC_RELEASE_WEEKLY_DECAY_PERCENT,
      A_WEEK,
      ethers.utils.parseEther(`${getSupplyOf(supplyDistribution)}`)
    );
}

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
