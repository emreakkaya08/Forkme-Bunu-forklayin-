import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber, Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

const ONE_YEAR = 365 * 24 * 60 * 60;

const now = () => Math.floor(new Date().getTime() / 1000);

describe('VestingByTimeWallet', async () => {
  let contract: Contract;
  let startTimestamp: number;
  let duringTimestamp: number;

  let zoicTokenCoffer: Contract;
  let zoicToken: Contract;

  let releaseToAddress: SignerWithAddress = null;

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
    releaseToAddress = addr1;

    startTimestamp = now();
    // duringTimestamp set during 6 years
    duringTimestamp = 6 * ONE_YEAR;

    const VestingByTimeWalletContract = await ethers.getContractFactory(
      'VestingByTimeWallet'
    );
    contract = await upgrades.deployProxy(VestingByTimeWalletContract, [
      releaseToAddress.address,
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
    const releasable = await contract['releasable(address)'](zoicToken.address);
    expect(releasable).to.be.gt(ethers.utils.parseEther('0'));

    await expect(contract['release(address)'](zoicToken.address)).to.emit(
      contract,
      'ERC20Released'
    );

    const balance = await zoicToken.balanceOf(releaseToAddress.address);
    expect(balance).to.be.gt(ethers.utils.parseEther('0'));

    const released = await contract['released(address)'](zoicToken.address);
    expect(released).to.equal(balance);
  });

  describe('VestingByTimeWallet distribute tokens', async () => {
    it('distribute all tokens', async () => {
      const total = await zoicToken.balanceOf(zoicTokenCoffer.address);

      const [owned, addr1, addr2] = await ethers.getSigners();
      const startTime = now();

      await zoicTokenCoffer.grantRole(
        ethers.utils.id('WITHDRAW'),
        addr1.address
      );

      const VestingByTimeWalletContract = await ethers.getContractFactory(
        'VestingByTimeWallet'
      );
      const firstYear = await upgrades.deployProxy(
        VestingByTimeWalletContract,
        [addr2.address, startTime, ONE_YEAR]
      );
      await firstYear.deployed();
      await zoicTokenCoffer
        .connect(addr1)
        .withdrawERC20(
          zoicToken.address,
          firstYear.address,
          ethers.utils.parseEther(releaseList[0].toString())
        );

      const secondYear = await upgrades.deployProxy(
        VestingByTimeWalletContract,
        [addr2.address, startTime + ONE_YEAR, ONE_YEAR]
      );
      await secondYear.deployed();
      await zoicTokenCoffer
        .connect(addr1)
        .withdrawERC20(
          zoicToken.address,
          secondYear.address,
          ethers.utils.parseEther(releaseList[1].toString())
        );

      expect(await zoicToken.balanceOf(zoicTokenCoffer.address)).to.equal(
        ethers.utils
          .parseEther(zoicTokenAmount.toString())
          .sub(ethers.utils.parseEther(releaseList[0].toString()))
          .sub(ethers.utils.parseEther(releaseList[1].toString()))
      );
      const firstYearReleasable = await firstYear['releasable(address)'](
        zoicToken.address
      );
      expect(firstYearReleasable).to.be.gt(ethers.utils.parseEther('0'));

      const secondYearReleasable = await secondYear['releasable(address)'](
        zoicToken.address
      );
      expect(secondYearReleasable).to.be.eq(ethers.utils.parseEther('0'));
    });
  });
});
