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

  it('TokenTreasury ETHReceived Test', async () => {
    const noneETH = ethers.utils.parseEther('0');
    expect(await ethers.provider.getBalance(contract.address)).to.equal(
      noneETH
    );

    const ethAmount = ethers.utils.parseEther('10');

    const [owner, addr1] = await ethers.getSigners();

    const transferETH = {
      to: addr1.address,
      value: ethers.utils.parseEther('10').toHexString(),
    };

    const balanceBefore = await ethers.provider.getBalance(addr1.address);
    const tx = await ethers.provider.send('eth_sendTransaction', [transferETH]);
    // const receipt = await ethers.provider.getTransactionReceipt(tx);

    expect(await ethers.provider.getBalance(addr1.address)).to.equal(
      balanceBefore.add(ethAmount)
    );

    // transfer ETH
    await expect(
      addr1.sendTransaction({ to: contract.address, value: ethAmount })
    )
      .to.emit(contract, 'TokenReceived')
      .withArgs(addr1.address, ethAmount);

    expect(await ethers.provider.getBalance(contract.address)).to.equal(
      ethAmount
    );
  });

  it('TokenTreasury USDT transfer test', async () => {
    // transfer U
    const [owner, addr1] = await ethers.getSigners();

    const USDTContract = await ethers.getContractFactory('XYGameUSDT');
    const usdt = await upgrades.deployProxy(USDTContract, []);
    await usdt.deployed();

    const usdtAmount = ethers.utils.parseEther('100');
    await usdt.mint(addr1.address, usdtAmount);

    const balanceBefore = await usdt.balanceOf(addr1.address);
    expect(balanceBefore).to.equal(usdtAmount);

    expect(await usdt.connect(addr1).transfer(contract.address, usdtAmount))
      .to.emit(contract, 'TokenReceived')
      .withArgs(addr1.address, usdtAmount);

    expect(await usdt.balanceOf(contract.address)).to.equal(usdtAmount);

    expect(await usdt.balanceOf(addr1.address)).to.equal(
      usdtAmount.sub(usdtAmount)
    );

    await contract.grantRole(ethers.utils.id('WITHDRAW'), addr1.address);
    expect(
      await contract
        .connect(addr1)
        .withdrawERC20(usdt.address, addr1.address, usdtAmount)
    );

    expect(await usdt.balanceOf(addr1.address)).to.equal(
      balanceBefore.sub(usdtAmount).add(usdtAmount)
    );
    expect(await usdt.balanceOf(contract.address)).to.equal(
      ethers.utils.parseEther('0')
    );
  });
});
