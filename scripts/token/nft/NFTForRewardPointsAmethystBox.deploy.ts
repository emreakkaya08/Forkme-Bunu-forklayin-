import { ContractDeployAddress } from "../../consts/deploy.address.const";
import {
  deployUpgradeProxy,
  deployUpgradeUpdate,
} from "../../utils/deploy.util";

async function main() {
  const contractAddress = ContractDeployAddress.NFTForRewardPointsAmethystBox;
  const DeployContractName = "NFTForRewardPoints";
  if (contractAddress) {
    const contract = await deployUpgradeUpdate(
      DeployContractName,
      contractAddress
    );
  } else {
    // TODO need confirm the name and max mint amount
    const contract = await deployUpgradeProxy(DeployContractName, [
      "CenoZoicPointsAmethystBox",
      "CZPA",
      1000,
    ]);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
