import { ContractDeployAddress } from "../consts/deploy.address.const";
import {
  deployUpgradeProxy,
  deployUpgradeUpdateWithProposal,
} from "../utils/deploy.util";

async function main() {
  const contractAddress = ContractDeployAddress.GameAccountTemplate;
  const DeployContractName = "GameAccount";
  if (contractAddress) {
    const contract = await deployUpgradeUpdateWithProposal(
      DeployContractName,
      contractAddress
    );
  } else {
    const contract = await deployUpgradeProxy(DeployContractName, ["game-tpl"]);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
