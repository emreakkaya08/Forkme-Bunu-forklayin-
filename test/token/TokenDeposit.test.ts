import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('TokenDeposit', () => {
  let contract: Contract;
  let xToken: Contract;

  const WITHDRAW = ethers.utils.solidityKeccak256(['string'], ['WITHDRAW']);

  beforeEach(async () => {
    const XToken = await ethers.getContractFactory('StableTokenX');
    xToken = await upgrades.deployProxy(XToken, []);
    await xToken.deployed();

    const TokenDeposit = await ethers.getContractFactory('TokenDeposit');
    contract = await upgrades.deployProxy(TokenDeposit, [xToken.address]);
    await contract.deployed();
  });

  it('contract to be defined', async () => {
    expect(contract).to.be.instanceOf(Contract);
  });

  it('USDT to xToken', async () => {
    const MockUsdt = await ethers.getContractFactory('StableTokenX');
    const usdt = await upgrades.deployProxy(MockUsdt, []);
    await usdt.deployed();

    // grant contract MINTER_ROLE
    await xToken.grantRole(ethers.utils.id('MINTER_ROLE'), contract.address);

    const [owner, from, withdrawRole, withdrawTo] = await ethers.getSigners();
    const uAmount = ethers.utils.parseEther('100');
    await usdt.mint(from.address, uAmount);

    expect(await usdt.balanceOf(from.address)).to.equal(uAmount);

    const swapAmount = ethers.utils.parseEther('20');

    expect(await usdt.balanceOf(contract.address)).to.equal(
      ethers.utils.parseEther('0')
    );

    await usdt.connect(from).approve(contract.address, swapAmount);
    await expect(contract.connect(from).depositERC20(usdt.address, swapAmount))
      .to.emit(contract, 'DepositERC20')
      .withArgs(from.address, swapAmount, swapAmount);

    expect(await usdt.balanceOf(contract.address)).to.equal(swapAmount);

    expect(await usdt.balanceOf(from.address)).to.equal(
      uAmount.sub(swapAmount)
    );

    expect(await xToken.balanceOf(from.address)).to.equal(swapAmount);

    const reason = `AccessControl: account ${ethers.utils
      .getAddress(withdrawRole.address)
      .toLowerCase()} is missing role ${WITHDRAW}`;
    await expect(
      contract
        .connect(withdrawRole)
        .withdrawERC20(usdt.address, withdrawTo.address, swapAmount)
    ).to.be.revertedWith(reason);

    contract.grantRole(WITHDRAW, withdrawRole.address);
    await expect(
      contract
        .connect(withdrawRole)
        .withdrawERC20(usdt.address, withdrawTo.address, swapAmount)
    )
      .to.emit(contract, 'WithdrawERC20')
      .withArgs(usdt.address, withdrawTo.address, swapAmount);

    expect(await usdt.balanceOf(contract.address)).to.equal(
      ethers.utils.parseEther('0')
    );

    expect(await usdt.balanceOf(withdrawTo.address)).to.equal(swapAmount);
  });
});
