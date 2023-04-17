// SPDX-License-Identifier: SEE LICENSE IN LICENSE
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('XYSwap', function () {
  let contract: Contract; // XYSwap
  let yToken: Contract;
  const conversionRate = 2;

  const WITHDRAW = ethers.utils.solidityKeccak256(['string'], ['WITHDRAW']);

  beforeEach(async function () {
    // deploy YToken
    const [owner] = await ethers.getSigners();
    const YToken = await ethers.getContractFactory('YToken');
    yToken = await upgrades.deployProxy(YToken);
    await yToken.deployed();

    console.log('owner Y init amount: ', await yToken.balanceOf(owner.address));
    const XYSwap = await ethers.getContractFactory('XYSwap',owner);
    contract = await upgrades.deployProxy(XYSwap, [
      yToken.address
    ]);
    await contract.deployed();
  });

  it('should return the correct conversion rate', async function () {
    const returnedConversionRate = await contract.getConversionRate();
    expect(returnedConversionRate).to.equal(conversionRate);
  });

  it('should set the conversion rate correctly', async function () {
    const [owner] = await ethers.getSigners();
    const newConversionRate = 3;
    await contract.connect(owner).setConversionRate(newConversionRate);

    const returnedConversionRate = await contract.getConversionRate();
    expect(returnedConversionRate).to.equal(newConversionRate);
  });

  it('contract to be defined', async () => {
    expect(contract).to.be.instanceOf(Contract);
  });

  it('should deposit ERC20 and receive Y Token', async function () {
    // deploy XToken
    const [from, withdrawRole, withdrawTo] = await ethers.getSigners();
    const XTokenFactory = await ethers.getContractFactory('XToken');
    const xToken = await upgrades.deployProxy(XTokenFactory);
    await xToken.deployed();

    //  mint 100 XToken to contract
    const xTokenAmount = ethers.utils.parseEther('100');
    await xToken.connect(from).mint(xTokenAmount);

    console.log('xTokenAmount: ', xTokenAmount);
    console.log('from X amount: ', await xToken.balanceOf(from.address));
    expect(await xToken.balanceOf(from.address)).to.equal(xTokenAmount);

    // from 'from' 20 XToken to contract
    const swapAmount = ethers.utils.parseEther('20');

    // contract has none XToken
    expect(await xToken.balanceOf(contract.address)).to.equal(
      ethers.utils.parseEther('0')
    );

    //授权 XTOKEN
    await xToken.connect(from).approve(contract.address, swapAmount);

    // approve YToken to contract
    await yToken.approve(contract.address, swapAmount.mul(conversionRate));

    //contract X --> Y
    await contract.connect(from).XConversionY(xToken.address, swapAmount);

    console.log(
      'contract X amount: ',
      await xToken.balanceOf(contract.address)
    );

    console.log(
      'contract y amount: ',
      await yToken.balanceOf(contract.address)
    );

    expect(await xToken.balanceOf(contract.address)).to.equal(swapAmount);

    console.log('from x amount', await xToken.balanceOf(from.address));
    console.log('from y amount', await yToken.balanceOf(from.address));

    expect(await xToken.balanceOf(from.address)).to.equal(
      xTokenAmount.sub(swapAmount)
    );

    // from 里的 YToken 是当前 Y Token 余额
    const yTokenBalance = await yToken.balanceOf(from.address);

    console.log('from yTokenBalance', yTokenBalance);

    //比较 contract 里的 YToken 数量和转移的 X * 费率一致
    expect(await yToken.balanceOf(contract.address)).to.equal(swapAmount.mul(conversionRate));

    // withdrawRole 里面没有 WITHDRAW 权限
    const reason = `AccessControl: account ${ethers.utils
      .getAddress(withdrawRole.address)
      .toLowerCase()} is missing role ${WITHDRAW}`;
    await expect(
      contract
        .connect(withdrawRole)
        .withdrawERC20(xToken.address, withdrawTo.address, swapAmount)
    ).to.be.revertedWith(reason);

    // owner 给 withdrawRole WITHDRAW 权限
    await contract.grantRole(WITHDRAW, withdrawRole.address);

    // withdrawRole 里面有 WITHDRAW 权限
    await expect(
      contract
        .connect(withdrawRole)
        .withdrawERC20(xToken.address, withdrawTo.address, swapAmount)
    )
      .to.emit(contract, 'WithdrawERC20')
      .withArgs(xToken.address, withdrawTo.address, swapAmount);

    expect(await xToken.balanceOf(contract.address)).to.equal(
      ethers.utils.parseEther('0')
    );

    // withdrawTo 里面的 XToken 增加 20个
    expect(await xToken.balanceOf(withdrawTo.address)).to.equal(swapAmount);
  });
});
