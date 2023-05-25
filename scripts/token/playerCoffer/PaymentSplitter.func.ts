import {ethers} from 'hardhat';
import {ContractDeployAddress} from '../../consts/deploy.address.const';

async function getContract(name: string, address: ContractDeployAddress) {
    const contract = await ethers.getContractAt(name, address);
    const [owner] = await ethers.getSigners();
    
    return contract.connect(owner);
}

async function paymentSplitter() {
    
    const paymentSplitter = await getContract(
        'PaymentSplitter',
        ContractDeployAddress.PaymentSplitter
    );
    
    const [owned] = await ethers.getSigners();
    
    // grant UPGRADE role to splitter
    const tx = await paymentSplitter.grantRole(
        ethers.utils.id('UPGRADE'),
        owned.address
    );
    
    const receipt = await tx.wait();
    console.log(receipt);
    
    const split = await paymentSplitter.paymentSplitter();
    
    const reward = await paymentSplitter.getPlayerAwarded();
    console.log('reward', reward.toString());
    
}

async function getZOICAward() {
    
    const paymentSplitter = await getContract(
        'PaymentSplitter',
        ContractDeployAddress.PaymentSplitter
    );
    
    const [owned] = await ethers.getSigners();
    
    const award = await paymentSplitter.getZOICAward();
    console.log('award', award.toString());
}

async function releaseZOIC() {
    
    const zoicTokenCoffer = await getContract(
        'TokenCoffer',
        ContractDeployAddress.ZOICTokenCoffer
    );
    
    const [owned] = await ethers.getSigners();
    //grant minter role to default caller
    const tx = await zoicTokenCoffer.grantRole(
        ethers.utils.id('WITHDRAW'),
        owned.address
    );
    const receipt = await tx.wait();
    console.log(receipt);
    
}

async function main() {
    await paymentSplitter();
    await getZOICAward();
    await releaseZOIC();
}

