
import { ContractDeployAddress } from '../consts/deploy.address.const';
import {
    deployUpgradeProxy,
    deployUpgradeUpdateWithProposal,
} from '../utils/deploy.util';

async function main() {
    const contractAddress = ContractDeployAddress.XToken;
    const DeployContractName = 'XToken';
    if (contractAddress) {
        const contract = await deployUpgradeUpdateWithProposal(
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

