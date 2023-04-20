import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('TokenTreasury', async () => {
  let contract: Contract;

  beforeEach(async () => {
    const TokenTreasuryContract = await ethers.getContractFactory(
      'TokenTreasury'
    );
    contract = await upgrades.deployProxy(TokenTreasuryContract, []);
    await contract.deployed();
  });

  it('TokenTreasury Test', async () => {
    expect(contract).to.be.instanceOf(Contract);
  });
});
