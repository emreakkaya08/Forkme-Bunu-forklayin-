import { ContractDeployAddress } from '../../consts/deploy.address.const';
import {
  deployUpgradeProxy,
  deployUpgradeUpdate,
} from '../../utils/deploy.util';

const DeployContractName = 'TokenCofferPaymentSplitter';
const contractAddress = ContractDeployAddress.TokenCofferPaymentSplitter;

async function main() {
  if (contractAddress) {
    const contract = await deployUpgradeUpdate(
      DeployContractName,
      contractAddress
    );
  } else {
    const contract = await deployUpgradeProxy(DeployContractName, [
      [
        ContractDeployAddress.GameTokenCoffer,
        ContractDeployAddress.PoolTokenCoffer,
        ContractDeployAddress.VaultTokenCoffer,
        ContractDeployAddress.TeamTokenCoffer,
      ],
      [53, 20, 17, 10],
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
