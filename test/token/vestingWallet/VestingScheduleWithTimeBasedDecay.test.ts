import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import exp from "constants";
import { BigNumber, Contract } from "ethers";
import { ethers, upgrades } from "hardhat";

const WEEK = 7 * 24 * 60 * 60;
const WEEKS_360 = WEEK * 360;

const now = () => Math.floor(new Date().getTime() / 1000);

describe("VestingScheduleWithTimeBasedDecay", async () => {
  let contract: Contract;
  let contractCENO: Contract;
  let startTimestamp: number;
  let duringTimestamp: number;

  beforeEach(async () => {
    const [owner, addr1] = await ethers.getSigners();

    startTimestamp = now();
    // duringTimestamp set during 6 years
    duringTimestamp = WEEKS_360;

    const VestingScheduleWithTimeBasedDecayContract =
      await ethers.getContractFactory("VestingScheduleWithTimeBasedDecay");
    contract = await upgrades.deployProxy(
      VestingScheduleWithTimeBasedDecayContract,
      [addr1.address, startTimestamp, duringTimestamp]
    );
    await contract.deployed();

    const TokenCENOContract = await ethers.getContractFactory("TokenCENO");
    contractCENO = await upgrades.deployProxy(TokenCENOContract, []);
    await contractCENO.deployed();

    contract.grantRole(ethers.utils.id("TOKEN_SETTER_ROLE"), owner.address);
    await contract
      .connect(owner)
      .addTokenInfo(
        contractCENO.address,
        360,
        1,
        WEEK,
        ethers.utils.parseEther("450000000")
      );
  });

  it("tokenReleaseAmount", async () => {
    const firstReleaseAmount = await contract.tokenReleaseAmount(
      contractCENO.address,
      1
    );
    const first = (450000000 * 0.01) / (1 - Math.pow(0.99, 360));

    const lastReleaseAmount = await contract.tokenReleaseAmount(
      contractCENO.address,
      360
    );
    const last = first * Math.pow(0.99, 359);

    expect(
      Number(ethers.utils.formatEther(firstReleaseAmount)).toFixed(0)
    ).to.equal(first.toFixed(0));
    expect(
      Number(ethers.utils.formatEther(lastReleaseAmount)).toFixed(0)
    ).to.equal(last.toFixed(0));

    console.log(
      "lastReleaseAmount",
      ethers.utils.formatEther(lastReleaseAmount),
      ethers.utils.formatEther(firstReleaseAmount)
    );
  });

  it("vestedAmount test", async () => {
    const currentReleased = await contract["released(address)"](
      contractCENO.address
    );
    expect(currentReleased).to.equal(0);

    const startBigNum = await contract["start()"]();
    const start = Number(startBigNum.toString());
    const vestedAmount = await contract["vestedAmount(address,uint64)"](
      contractCENO.address,
      start - WEEK + 24 * 60 * 60
    );
    expect(vestedAmount).to.equal(0);

    const vestedAmount2 = await contract["vestedAmount(address,uint64)"](
      contractCENO.address,
      start + WEEK
    );
    const firstReleaseAmount = await contract.tokenReleaseAmount(
      contractCENO.address,
      1
    );
    expect(vestedAmount2).to.equal(firstReleaseAmount);

    const vestedAmount3 = await contract["vestedAmount(address,uint64)"](
      contractCENO.address,
      start + WEEK + 24 * 60 * 60
    );
    expect(vestedAmount3).to.equal(firstReleaseAmount);

    const vestedAmount4 = await contract["vestedAmount(address,uint64)"](
      contractCENO.address,
      start + WEEK * 2
    );
    const secondReleaseAmount = await contract.tokenReleaseAmount(
      contractCENO.address,
      2
    );
    expect(vestedAmount4).to.equal(firstReleaseAmount.add(secondReleaseAmount));

    await expect(
      contract["vestedAmount(address,uint64)"](
        contractCENO.address,
        start + WEEK * 200
      )
    ).to.be.revertedWith("too far away from last release time");
  });
});
