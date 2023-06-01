import { ContractDeployAddress } from "scripts/consts/deploy.address.const";
import {
  deployUpgradeProxy,
  deployUpgradeUpdate,
} from "scripts/utils/deploy.util";
import { IDO_RELEASE_START_TIME } from "../Tokenomics.const";
import { IDO_RELEASE_DURATION } from "../Tokenomics.const";

const DeployContractName = "VestingByTimeWallet";
const contractAddress = ContractDeployAddress.TokenZOICIDOVestingByDay;

async function main() {
  if (contractAddress) {
    const contract = await deployUpgradeUpdate(
      DeployContractName,
      contractAddress
    );
  } else {
    const startTimestamp = IDO_RELEASE_START_TIME;
    const duration = IDO_RELEASE_DURATION;

    const contract = await deployUpgradeProxy(DeployContractName, [
      ContractDeployAddress.TokenCofferIDOLinnerRelease,
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
