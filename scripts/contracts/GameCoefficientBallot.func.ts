import {ethers} from 'hardhat';
import {ContractDeployAddress} from '../consts/deploy.address.const';

async function getContract() {
    const contract = await ethers.getContractAt(
        'GameCoefficientBallot',
        ContractDeployAddress.GameCoefficientBallot
    );
    const [owner] = await ethers.getSigners();
    
    return contract.connect(owner);
}

async function startBallot() {
    const contract = await getContract();
    
    // random address
    // 0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B  assume to be game Burger Challenge
    // 0x1Db3439a222C519ab44bb1144fC28167b4Fa6EE6  assume to be game Save the Princess
    let burgerChallenge = ethers.utils.getAddress("0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B");
    let saveThePrincess = ethers.utils.getAddress("0x1Db3439a222C519ab44bb1144fC28167b4Fa6EE6");
    // random address
    // 0x220866B1A2219f40e72f5c628B65D54268cA3A9D  assume to be player Link
    // 0xD04daa65144b97F147fbc9a9B45E741dF0A28fd7  assume to be player Zelda
    let link = ethers.utils.getAddress("0x220866B1A2219f40e72f5c628B65D54268cA3A9D");
    let zelda = ethers.utils.getAddress("0xD04daa65144b97F147fbc9a9B45E741dF0A28fd7");
    
    contract.startBallot([burgerChallenge, saveThePrincess], [20, 80]);
}


async function main() {
    await startBallot();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
