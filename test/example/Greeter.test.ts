import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('Greeter', function () {
  let contract: Contract;

  beforeEach(async () => {
    const Greeter = await ethers.getContractFactory('Greeter');
    contract = await upgrades.deployProxy(Greeter, ['Hello, world!']);
    await contract.deployed();
  });

  it('Should get role to set greeting', async function () {
    const [owner, signer2] = await ethers.getSigners();
    await contract.connect(owner).setGreeting("it's ok!");

    expect(await contract.greet()).to.equal("it's ok!");

    const reason = `AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0xfdeede333c6261dc02ece53d289e60baf7bb77b797f7a4f0117b59fcca826981`;
    await expect(
      contract.connect(signer2).setGreeting("it's ok!")
    ).to.revertedWith(reason);
  });

  it("Should return the new greeting once it's changed", async function () {
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

  it('Should pause contract', async function () {
    await contract.pause();

    await expect(contract.setGreeting('Hola, mundo!')).to.be.revertedWith(
      'Pausable: paused'
    );
  });
});
