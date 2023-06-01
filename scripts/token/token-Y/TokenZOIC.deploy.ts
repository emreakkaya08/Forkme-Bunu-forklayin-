import { ContractDeployAddress } from "../../consts/deploy.address.const";
import {
  deployUpgradeProxy,
  deployUpgradeUpdate,
} from "../../utils/deploy.util";
import { SupplyDistribution } from "../tokenomics/Tokenomics.const";

async function main() {
  const contractAddress = ContractDeployAddress.TokenZOIC;
  const DeployContractName = "TokenZOIC";
  if (contractAddress) {
    const contract = await deployUpgradeUpdate(
      DeployContractName,
      contractAddress
    );
  } else {
    const contract = await deployUpgradeProxy(DeployContractName, [
      [
        ContractDeployAddress.TokenCofferAirdrop,
        ContractDeployAddress.TokenCofferIDOToTGE,
        ContractDeployAddress.TokenCofferIDOVesting,
        ContractDeployAddress.PlayersVestingDecayByWeek,
        ContractDeployAddress.DevsVestingDecayByWeek,
        ContractDeployAddress.StakingRewardsVestingDecayByWeek,
        ContractDeployAddress.TeamVestingDecayByWeek,
      ],
      [
        SupplyDistribution.Airdrop,
        SupplyDistribution.IDOToTGE,
        SupplyDistribution.IDOLinnerRelease,
        SupplyDistribution.Players,
        SupplyDistribution.Devs,
        SupplyDistribution.StakingRewards,
        SupplyDistribution.Team,
      ],
    ]);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
