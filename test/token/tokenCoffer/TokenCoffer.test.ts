import { expect } from 'chai';
import { BigNumber, Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('TokenCoffer', async () => {
  let contract: Contract;

  beforeEach(async () => {
    const TokenCofferContract = await ethers.getContractFactory('TokenCoffer');
    contract = await upgrades.deployProxy(TokenCofferContract, []);
    await contract.deployed();
  });

  it('TokenCoffer Test', async () => {
    expect(contract).to.be.instanceOf(Contract);
  });

  it('TokenCoffer version', async () => {
    expect(await contract.version()).to.instanceOf(BigNumber);
  });

  it('TokenCoffer Withdraw test', async () => {
    const TokenZOICContract = await ethers.getContractFactory('TokenZOIC');
    const zoicContract = await upgrades.deployProxy(TokenZOICContract, [
      contract.address,
    ]);
    await zoicContract.deployed();

    const totalAmount = ethers.utils.parseEther('204800000');
    expect(await zoicContract.balanceOf(contract.address)).to.equal(
      totalAmount
    );

    const withdrawRole = ethers.utils.id('WITHDRAW');

    const withdrawAmount = ethers.utils.parseEther('1000000');
    const [owner, addr1] = await ethers.getSigners();
    const revertReason = `AccessControl: account ${ethers.utils
      .getAddress(addr1.address)
      .toLowerCase()} is missing role ${withdrawRole}`;

    // withdraw eth
    await expect(
      contract.connect(addr1).withdraw(addr1.address, withdrawAmount)
    ).to.be.revertedWith(revertReason);

    await contract.connect(owner).grantRole(withdrawRole, addr1.address);
    await expect(
      contract.connect(addr1).withdraw(addr1.address, withdrawAmount)
    ).to.be.revertedWith('Address: insufficient balance');

    // withdraw erc20
    await expect(
      contract
        .connect(addr1)
        .withdrawERC20(zoicContract.address, owner.address, withdrawAmount)
    )
      .emit(contract, 'WithdrawERC20')
      .withArgs(zoicContract.address, owner.address, withdrawAmount);
    expect(await zoicContract.balanceOf(owner.address)).to.equal(
      withdrawAmount
    );

    expect(await zoicContract.balanceOf(contract.address)).to.equal(
      totalAmount.sub(withdrawAmount)
    );
  });
});
