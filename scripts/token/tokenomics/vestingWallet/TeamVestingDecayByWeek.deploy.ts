import { ContractDeployAddress } from "../../../consts/deploy.address.const";
import {
  deployUpgradeProxy,
  deployUpgradeUpdate,
} from "../../../utils/deploy.util";
import {
  ZOIC_RELEASE_WEEKS_DURATION,
  ZoicReleaseStartTime,
} from "../Tokenomics.const";

const DeployContractName = "VestingScheduleWithTimeBasedDecay";
const contractAddress = ContractDeployAddress.TeamVestingDecayByWeek;

async function main() {
  if (contractAddress) {
    const contract = await deployUpgradeUpdate(
      DeployContractName,
      contractAddress
    );
  } else {
    const startTimestamp = ZoicReleaseStartTime.Team;
    const duration = ZOIC_RELEASE_WEEKS_DURATION;

    const contract = await deployUpgradeProxy(DeployContractName, [
      ContractDeployAddress.TokenCofferTeam,
      startTimestamp,
      duration,
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
