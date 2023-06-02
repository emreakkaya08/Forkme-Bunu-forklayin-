import { ContractDeployAddress } from "../../../consts/deploy.address.const";
import {
  deployUpgradeProxy,
  deployUpgradeUpdate,
} from "../../../utils/deploy.util";

async function main() {
  const contractAddress = ContractDeployAddress.TokenCofferIDOToTGE;
  const DeployContractName = "TokenCoffer";
  if (contractAddress) {
    const contract = await deployUpgradeUpdate(
      DeployContractName,
      contractAddress
    );
  } else {
    const contract = await deployUpgradeProxy(DeployContractName);
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
