import { ContractDeployAddress } from "scripts/consts/deploy.address.const";
import {
  deployUpgradeProxy,
  deployUpgradeUpdate,
} from "scripts/utils/deploy.util";
import {
  ZOIC_RELEASE_START_TIME,
  ZOIC_RELEASE_WEEKS_DURATION,
} from "../Tokenomics.const";

const DeployContractName = "VestingScheduleWithTimeBasedDecay";
const contractAddress = ContractDeployAddress.PlayersVestingDecayByWeek;

async function main() {
  if (contractAddress) {
    const contract = await deployUpgradeUpdate(
      DeployContractName,
      contractAddress
    );
  } else {
    const startTimestamp = ZOIC_RELEASE_START_TIME;
    const duration = ZOIC_RELEASE_WEEKS_DURATION;

    const contract = await deployUpgradeProxy(DeployContractName, [
      ContractDeployAddress.TokenCofferPlayers,
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
