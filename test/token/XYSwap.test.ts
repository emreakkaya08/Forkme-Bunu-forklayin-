// SPDX-License-Identifier: SEE LICENSE IN LICENSE
import { Address } from '@arbitrum/sdk';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe("XYSwap", function () {
  let contract: Contract;// XYSwap
  let yToken: Contract;

  const WITHDRAW = ethers.utils.solidityKeccak256(['string'], ['WITHDRAW']);

  beforeEach(async function () {

    // 部署 YToken
    const [owner] = await ethers.getSigners();
    const YToken = await ethers.getContractFactory('YToken', owner);
    yToken = await upgrades.deployProxy(YToken);
    await yToken.deployed();

    console.log("owner Y init amount: ", await yToken.balanceOf(owner.address));

    //指定账户,预存 10% 的 YToken
    const yTokenAddress = ethers.utils.getAddress("0x1234567890123456789012345678901234567890");
    const yTokenAccountAmount = ethers.utils.parseEther('10000000');
    await yToken.approve(yTokenAddress, yTokenAccountAmount);
    yToken.transfer(yTokenAddress, yTokenAccountAmount, { from: owner.address });

    console.log("owner Y amount: ", await yToken.balanceOf(owner.address));
    console.log("yTokenAccountAddress  YToken amount: ", await yToken.balanceOf(yTokenAddress));

    const XYSwap = await ethers.getContractFactory('XYSwap');
    contract = await upgrades.deployProxy(XYSwap, [yToken.address, yTokenAddress, 2]);
    await contract.deployed();
  });

  it('contract to be defined', async () => {
    expect(contract).to.be.instanceOf(Contract);
  });

  it("should deposit ERC20 and receive Y Token", async function () {
    // 部署 XToken
    const [from, withdrawRole, withdrawTo] = await ethers.getSigners();
    const XTokenFactory = await ethers.getContractFactory('XToken', from);
    const xToken = await upgrades.deployProxy(XTokenFactory);
    await xToken.deployed();

    // 先 mint 100个 XToken 给 contract
    const xTokenAmount = ethers.utils.parseEther('333');
    await xToken.connect(from).mint(xTokenAmount);

    console.log("xTokenAmount: ", xTokenAmount);
    console.log("from X amount: ", await xToken.balanceOf(from.address));
    expect(await xToken.balanceOf(from.address)).to.equal(xTokenAmount);

    // 从 from 转 20个 XToken 给 contract
    const swapAmount = ethers.utils.parseEther('20');

    // contract 里面没有 XToken
    expect(await xToken.balanceOf(contract.address)).to.equal(ethers.utils.parseEther('0'));

    // 从 from 转 20个 XToken 给 contract
    await xToken.approve(contract.address, swapAmount);
    xToken.transfer(contract.address, swapAmount, { from: from.address });
    console.log("转给contract  X amount: ", await xToken.balanceOf(contract.address));
    console.log("当前contract  Y amount: ", await yToken.balanceOf(contract.address));

    //contract X --> Y
    await contract.XConversionY(xToken.address, swapAmount);

    console.log("contract X amount: ", await xToken.balanceOf(contract.address));
    expect(await xToken.balanceOf(contract.address)).to.equal(swapAmount);
    expect(await xToken.balanceOf(from.address)).to.equal(xTokenAmount.sub(swapAmount));

    // contract 里面的 YToken 增加 40个
    const yTokenBalance = await yToken.balanceOf(contract.address);
    expect(yTokenBalance).to.equal(swapAmount.mul(2));

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