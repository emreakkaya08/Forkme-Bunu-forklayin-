import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('Greeter', function () {
  it("Should return the new greeting once it's changed", async function () {
    let contract: Contract;
    const Greeter = await ethers.getContractFactory('Greeter');
    contract = await upgrades.deployProxy(Greeter, ['Hello, world!']);
    await contract.deployed();

    expect(await contract.greet()).to.equal('Hello, world!');

    const [owner] = await ethers.getSigners();
    await expect(contract.connect(owner).setGreeting('Hola, mundo!'))
      .to.emit(contract, 'GreetingChanged')
      .withArgs(owner.address, 'Hola, mundo!');

    expect(await contract.greet()).to.equal('Hola, mundo!');

    const setGreetingTx = await contract.setGreeting('Hello, world!');

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await contract.greet()).to.equal('Hello, world!');
  });
});
