import { expect } from 'chai';
import { BigNumber, Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

function getMessageHash(to: string, value: BigNumber, nonce: BigNumber) {
  const messageHash = ethers.utils.solidityKeccak256(
    ['address', 'uint256', 'uint256'],
    [to, value, nonce]
  );

  return ethers.utils.arrayify(messageHash);
}

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

  it('TokenTreasury USDT withdraw test', async () => {
    const total = ethers.utils.parseEther('10');
    const transferETH = {
      to: contract.address,
      value: total.toHexString(),
    };
    await ethers.provider.send('eth_sendTransaction', [transferETH]);
    const balanceOfETH = await ethers.provider.getBalance(contract.address);
    expect(balanceOfETH).to.equal(total);

    const [owner, addr1, addr2] = await ethers.getSigners();

    const nonce: BigNumber = await contract.connect(addr1).getNonce();
    expect(nonce.toString()).to.equal('0');

    const amount = ethers.utils.parseEther('5');
    const hash = getMessageHash(addr1.address, amount, nonce);
    const signature = await addr2.signMessage(hash);

    const recovery = await contract.recoverSigner(hash, signature);
    expect(recovery).to.equal(addr2.address);

    const WITHDRAW_ROLE = ethers.utils.id('WITHDRAW');

    const revertedWith = `AccessControl: account ${ethers.utils
      .getAddress(addr2.address)
      .toLowerCase()} is missing role ${WITHDRAW_ROLE}`;

    await expect(
      contract.connect(addr1).withdrawWithSignature(amount, signature)
    ).to.be.revertedWith(revertedWith);

    await contract.grantRole(WITHDRAW_ROLE, addr2.address);

    const addr1BalanceBefore = await ethers.provider.getBalance(addr1.address);

    await expect(
      contract.connect(addr1).withdrawWithSignature(amount, signature)
    )
      .to.emit(contract, 'Withdraw')
      .withArgs(addr1.address, amount);

    const balanceAfter = await ethers.provider.getBalance(contract.address);

    expect(balanceAfter).to.eq(total.sub(amount));

    const addr1BalanceAfter = await ethers.provider.getBalance(addr1.address);

    // some gas
    expect(addr1BalanceAfter).to.lt(amount.add(addr1BalanceBefore));
  });

  it('TokenTreasury USDT transfer test', async () => {
    // transfer U
    const [owner, addr1, addr2] = await ethers.getSigners();

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

    const nonce: BigNumber = await contract.connect(addr1).getNonce();
    expect(nonce.toString()).to.equal('0');

    const amount = ethers.utils.parseEther('50');
    const hash = getMessageHash(addr1.address, amount, nonce);
    const signature = await addr2.signMessage(hash);

    const recovery = await contract.recoverSigner(hash, signature);
    expect(recovery).to.equal(addr2.address);

    const WITHDRAW_ERC20_ROLE = ethers.utils.id('WITHDRAW_ERC20');

    const revertedWith = `AccessControl: account ${ethers.utils
      .getAddress(addr2.address)
      .toLowerCase()} is missing role ${WITHDRAW_ERC20_ROLE}`;

    await expect(
      contract
        .connect(addr1)
        .withdrawERC20WithSignature(usdt.address, amount, signature)
    ).to.be.revertedWith(revertedWith);

    await contract.grantRole(WITHDRAW_ERC20_ROLE, addr2.address);

    await expect(
      contract
        .connect(addr1)
        .withdrawERC20WithSignature(usdt.address, amount, signature)
    )
      .to.emit(contract, 'WithdrawERC20')
      .withArgs(usdt.address, addr1.address, amount);

    expect(await usdt.balanceOf(contract.address)).to.equal(
      usdtAmount.sub(amount)
    );
    expect(await usdt.balanceOf(addr1.address)).to.eq(amount);
  });
});
