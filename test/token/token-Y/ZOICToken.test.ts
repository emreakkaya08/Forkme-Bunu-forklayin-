import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('ZOICToken', async () => {
  let contract: Contract;
  let zoicCoffer: Contract;

  beforeEach(async () => {
    const ZOICTokenCoffer = await ethers.getContractFactory('TokenCoffer');
    zoicCoffer = await upgrades.deployProxy(ZOICTokenCoffer, []);
    await zoicCoffer.deployed();

    const ZOICTokenContract = await ethers.getContractFactory('ZOICToken');
    contract = await upgrades.deployProxy(ZOICTokenContract, [
      zoicCoffer.address,
    ]);
    await contract.deployed();
  });

  it('ZOICToken Test', async () => {
    expect(contract).to.be.instanceOf(Contract);
    expect(await contract.name()).to.equal('ZOICToken');
    expect(await contract.symbol()).to.equal('ZOIC');
    expect(await contract.decimals()).to.equal(18);
  });

  it('ZOICToken Balance test', async () => {
    const balanceContract = await contract.balanceOf(contract.address);
    console.log('balanceContract', balanceContract);
    expect(await contract.balanceOf(contract.address)).to.equal(
      ethers.utils.parseEther('0')
    );
    expect(await contract.balanceOf(zoicCoffer.address)).to.equal(
      ethers.utils.parseEther('204800000')
    );
  });
});
