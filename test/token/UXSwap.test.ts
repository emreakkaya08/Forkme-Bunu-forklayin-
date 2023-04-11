import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('UXSwap', () => {
  let contract: Contract;
  let usdt: Contract;
  let xToken: Contract;

  beforeEach(async () => {
    const MockUsdt = await ethers.getContractFactory('StableTokenX');
    usdt = await upgrades.deployProxy(MockUsdt, []);
    await usdt.deployed();

    const XToken = await ethers.getContractFactory('StableTokenX');
    xToken = await upgrades.deployProxy(XToken, []);
    await xToken.deployed();

    const UXSwap = await ethers.getContractFactory('UXSwap');
    contract = await upgrades.deployProxy(UXSwap, [
      usdt.address,
      xToken.address,
    ]);
    await contract.deployed();
  });

  it('contract to be defined', async () => {
    expect(contract).to.be.instanceOf(Contract);
  });

  it('USDT to xToken Swap', async () => {
    xToken.grantRole(xToken.MINTER_ROLE(), contract.address);

    const [owner, from] = await ethers.getSigners();
    const uAmount = ethers.utils.parseEther('100');
    usdt.mint(from.address, uAmount);

    expect(await usdt.balanceOf(from.address)).to.equal(uAmount);

    const swapAmount = ethers.utils.parseEther('20');

    expect(await usdt.balanceOf(contract.address)).to.equal(
      ethers.utils.parseEther('0')
    );

    await usdt.connect(from).approve(contract.address, swapAmount);
    await contract.connect(from).swap(swapAmount);

    expect(await usdt.balanceOf(contract.address)).to.equal(swapAmount);

    expect(await usdt.balanceOf(from.address)).to.equal(
      uAmount.sub(swapAmount)
    );
    expect(await xToken.balanceOf(from.address)).to.equal(swapAmount);
  });
});
