import {ContractDeployAddress} from '../consts/deploy.address.const';
import {
    deployUpgradeProxy,
    deployUpgradeUpdate,
} from '../utils/deploy.util';

async function main() {
    const contractAddress = ContractDeployAddress.PlayerPaymentSplitter;
    const DeployContractName = 'PlayerPaymentSplitter';
    if (contractAddress) {
        const contract = await deployUpgradeUpdate(
            DeployContractName,
            contractAddress
        );
    } else {
        const contract = await deployUpgradeProxy(DeployContractName,
            ["0xBD0a99e6B1F3B0b47A4F95B90Ba918Ae05Ae0644",
                "0x79aceefD4Bc5743d57939d7c06C4E7FdCAe1566e",
                ContractDeployAddress.GameCoefficientBallot,
                ContractDeployAddress.PlayerConsumeRecord]);
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
