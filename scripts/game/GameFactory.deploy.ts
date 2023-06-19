import { ContractDeployAddress } from "../consts/deploy.address.const";
import {
  deployUpgradeProxy,
  deployUpgradeUpdateWithProposal,
} from "../utils/deploy.util";

async function main() {
  const contractAddress = ContractDeployAddress.GameFactory;
  const DeployContractName = "GameFactory";
  if (contractAddress) {
    const contract = await deployUpgradeUpdateWithProposal(
      DeployContractName,
      contractAddress
    );
  } else {
    const contract = await deployUpgradeProxy(DeployContractName, [
      ContractDeployAddress.GameAccountTemplate,
    ]);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
