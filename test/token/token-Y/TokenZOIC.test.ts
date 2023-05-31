import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('TokenZOIC', async () => {
  let contract: Contract;
  let tokenZoicCoffer: Contract;

  beforeEach(async () => {
    const ZOICTokenCoffer = await ethers.getContractFactory('TokenCoffer');
    tokenZoicCoffer = await upgrades.deployProxy(ZOICTokenCoffer, []);
    await tokenZoicCoffer.deployed();

    const TokenZOICContract = await ethers.getContractFactory('TokenZOIC');
    contract = await upgrades.deployProxy(TokenZOICContract, [
      [tokenZoicCoffer.address],
      [10000]
    ]);
    await contract.deployed();
  });

  it('TokenZOIC Test', async () => {
    expect(contract).to.be.instanceOf(Contract);
    expect(await contract.name()).to.equal('TokenZOIC');
    expect(await contract.symbol()).to.equal('ZOIC');
    expect(await contract.decimals()).to.equal(18);
  });

  it('TokenZOIC Balance test', async () => {
    expect(await contract.balanceOf(contract.address)).to.equal(
      ethers.utils.parseEther('0')
    );
    expect(await contract.balanceOf(tokenZoicCoffer.address)).to.equal(
      ethers.utils.parseEther('1000000000')
    );
  });
});
