import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('TokenDeposit', () => {
  let contract: Contract;
  let xToken: Contract;
  let treasury: Contract;
  let usdt: Contract;

  const WITHDRAW = ethers.utils.solidityKeccak256(['string'], ['WITHDRAW']);

  beforeEach(async () => {
    const XToken = await ethers.getContractFactory('StableTokenX');
    xToken = await upgrades.deployProxy(XToken, []);
    await xToken.deployed();

    const TokenDeposit = await ethers.getContractFactory('TokenDeposit');
    contract = await upgrades.deployProxy(TokenDeposit, [xToken.address]);
    await contract.deployed();

    const TreasuryContractFactory = await ethers.getContractFactory('Treasury');
    treasury = await upgrades.deployProxy(TreasuryContractFactory);
    await treasury.deployed();

    const MockUsdt = await ethers.getContractFactory('StableTokenX');
    usdt = await upgrades.deployProxy(MockUsdt, []);
    await usdt.deployed();

    contract.setTreasury(treasury.address);
  });

  it('contract to be defined', async () => {
    expect(contract).to.be.instanceOf(Contract);
  });

  it('USDT to xToken and balance to treasury and check treasury withdraw', async () => {
    await xToken.grantRole(ethers.utils.id('MINTER_ROLE'), contract.address);
    const [from, withdrawRole, withdrawTo] = await ethers.getSigners();

    const uAmount = ethers.utils.parseEther('100');
    await usdt.mint(from.address, uAmount);

    expect(await usdt.balanceOf(from.address)).to.equal(uAmount);

    const swapAmount = ethers.utils.parseEther('20');

    expect(await usdt.balanceOf(contract.address)).to.equal(
      ethers.utils.parseEther('0')
    );

    expect(await usdt.balanceOf(treasury.address)).to.equal(
      ethers.utils.parseEther('0')
    );

    console.log('treasury balance : ', await usdt.balanceOf(treasury.address));

    await usdt.connect(from).approve(contract.address, swapAmount);
    await expect(contract.connect(from).depositERC20(usdt.address, swapAmount))
      .to.emit(contract, 'DepositERC20')
      .withArgs(from.address, swapAmount, swapAmount);

    console.log('await depositERC20  treasury balance : ', await usdt.balanceOf(treasury.address));

    expect(await usdt.balanceOf(treasury.address)).to.equal(swapAmount);

    expect(await usdt.balanceOf(from.address)).to.equal(
      uAmount.sub(swapAmount)
    );

    expect(await xToken.balanceOf(from.address)).to.equal(swapAmount);

    //check treasury withdraw
    const reason = `AccessControl: account ${ethers.utils
      .getAddress(withdrawRole.address)
      .toLowerCase()} is missing role ${WITHDRAW}`;
    await expect(
      treasury
        .connect(withdrawRole)
        .withdrawERC20(usdt.address, withdrawTo.address, swapAmount)
    ).to.be.revertedWith(reason);
    console.log('treasury withdraw missing role,  treasury balance : ', await usdt.balanceOf(treasury.address));

<<<<<<< HEAD
    await contract.grantRole(WITHDRAW, withdrawRole.address);
=======
    treasury.grantRole(WITHDRAW, withdrawRole.address);
>>>>>>> 53d63743ca33676da0ac75b7d5dc3e58eb5faf9b
    await expect(
      treasury
        .connect(withdrawRole)
        .withdrawERC20(usdt.address, withdrawTo.address, swapAmount)
    )
      .to.emit(treasury, 'WithdrawERC20')
      .withArgs(usdt.address, withdrawTo.address, swapAmount);

    console.log('treasury withdraw finshed,  treasury balance : ', await usdt.balanceOf(treasury.address));

    expect(await usdt.balanceOf(treasury.address)).to.equal(
      ethers.utils.parseEther('0')
    );

    expect(await usdt.balanceOf(withdrawTo.address)).to.equal(swapAmount);
  });
});
