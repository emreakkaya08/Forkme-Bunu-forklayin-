import { ethers } from 'hardhat';
import { ContractDeployAddress } from '../../consts/deploy.address.const';

async function getContract() {
  const contract = await ethers.getContractAt(
    'TokenCoffer',
    ContractDeployAddress.ZOICTokenCoffer
  );
  const [owner] = await ethers.getSigners();

  return contract.connect(owner);
}

async function withdraw() {
  const contract = await getContract();

  const [owned] = await ethers.getSigners();
  //grant minter role to default caller
  const tx = await contract.grantRole(
    ethers.utils.id('WITHDRAW'),
    owned.address
  );
  const receipt = await tx.wait();

  const txWithdraw = await contract
    .connect(owned)
    .withdrawERC20(
      ContractDeployAddress.TokenZOIC,
      '0xfcCCE324CA463aD8C2946A8aC7ADE24231FB819D',
      ethers.utils.parseEther('1000')
    );

  const receiptWithdraw = await txWithdraw.wait();

  console.log('transfer:', receiptWithdraw);

  console.log('withdraw done');
}

async function main() {
  // await withdraw();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
