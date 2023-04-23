import { expect } from 'chai';
import { BigNumber, Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('VestingByTimeWallet', async () => {
  let contract: Contract;
  let startTimestamp: number;
  let duringTimestamp: number;

  let zoicTokenCoffer: Contract;
  let zoicToken: Contract;

  let zoicTokenAmount = 204800000;
  let initRate = 0.5075;
  let releaseList = [
    Math.floor(zoicTokenAmount * initRate),
    Math.floor((zoicTokenAmount * initRate) / 2),
    Math.floor((zoicTokenAmount * initRate) / 2 / 2),
    Math.floor((zoicTokenAmount * initRate) / 2 / 2 / 2),
    Math.floor((zoicTokenAmount * initRate) / 2 / 2 / 2 / 2),
    Math.floor((zoicTokenAmount * initRate) / 2 / 2 / 2 / 2 / 2),
  ];

  beforeEach(async () => {
    const [owner, addr1] = await ethers.getSigners();

    startTimestamp = Math.floor(new Date().getTime() / 1000);
    // duringTimestamp set during 6 years
    duringTimestamp = 6 * 365 * 24 * 60 * 60;

    const VestingByTimeWalletContract = await ethers.getContractFactory(
      'VestingByTimeWallet'
    );
    contract = await upgrades.deployProxy(VestingByTimeWalletContract, [
      addr1.address,
      startTimestamp,
      duringTimestamp,
    ]);
    await contract.deployed();

    const ZOICTokenCoffer = await ethers.getContractFactory('TokenCoffer');
    zoicTokenCoffer = await upgrades.deployProxy(ZOICTokenCoffer, []);
    await zoicTokenCoffer.deployed();

    const ZOICToken = await ethers.getContractFactory('TokenZOIC');
    zoicToken = await upgrades.deployProxy(ZOICToken, [
      zoicTokenCoffer.address,
    ]);
    await zoicToken.deployed();
  });

  it('VestingByTimeWallet Test', async () => {
    expect(contract).to.be.instanceOf(Contract);
    expect(await contract.version()).to.be.instanceOf(BigNumber);
  });

  it('should distribute less than total', async () => {
    const total = releaseList.map((item) => item).reduce((a, b) => a + b, 0);
    expect(total <= zoicTokenAmount);

    const releaseRate = releaseList
      .map((item) => item / zoicTokenAmount)
      .reduce((a, b) => a + b, 0);
    expect(releaseRate <= 1);
  });

  it('compute vesting tokens before startTime', async () => {
    await expect(
      contract.vestingTokens(
        zoicTokenAmount,
        startTimestamp - 1,
        startTimestamp,
        duringTimestamp
      )
    ).to.be.revertedWith('Panic');
  });

  it('compute vesting tokens at startTime', async () => {
    expect(
      await contract.vestingTokens(
        zoicTokenAmount,
        startTimestamp,
        startTimestamp,
        duringTimestamp
      )
    ).to.equal(0);
  });

  it('compute vesting tokens at endTime', async () => {
    expect(
      await contract.vestingTokens(
        zoicTokenAmount,
        startTimestamp + duringTimestamp,
        startTimestamp,
        duringTimestamp
      )
    ).to.equal(zoicTokenAmount);
  });

  it('should compute vesting tokens', async () => {
    const [owner, addr1] = await ethers.getSigners();
    const total = ethers.utils.parseEther(zoicTokenAmount.toString());

    expect(await zoicToken.balanceOf(zoicTokenCoffer.address)).to.equal(total);
    expect(await zoicToken.balanceOf(contract.address)).to.equal(
      ethers.utils.parseEther('0')
    );

    await zoicTokenCoffer.connect(addr1);
    await zoicTokenCoffer.grantRole(ethers.utils.id('WITHDRAW'), addr1.address);

    // transfer zoic to vest
    await zoicTokenCoffer
      .connect(addr1)
      .withdrawERC20(zoicToken.address, contract.address, total);

    expect(await zoicToken.balanceOf(contract.address)).to.equal(total);

    const method = contract['vestedAmount(address,uint64)'];
    expect(
      await method.call(
        contract,
        zoicToken.address,
        startTimestamp + duringTimestamp
      )
    ).to.equal(total);

    expect(
      await contract['releasable(address)'](zoicToken.address)
    ).to.greaterThan(ethers.utils.parseEther('0'));
  });
});
