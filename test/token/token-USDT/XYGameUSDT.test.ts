import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';

describe('XYGameUSDT', async () => {
  it('XYGameUSDT Test', async function () {
    const XYGameUSDT = await ethers.getContractFactory('XYGameUSDT');
    const xyGameUSDT = await upgrades.deployProxy(XYGameUSDT);
    await xyGameUSDT.deployed();

    expect(await xyGameUSDT.name()).to.equal('XYGame-USDT');
    expect(await xyGameUSDT.symbol()).to.equal('XYUSDT');
  });
});
