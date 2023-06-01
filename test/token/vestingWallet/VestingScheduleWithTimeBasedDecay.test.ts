import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers, upgrades } from "hardhat";

const WEEKS_360 = 7 * 24 * 60 * 60 * 360;

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
  });

  it("should return the correct value", async () => {
    const [owner, addr1] = await ethers.getSigners();
    contract.grantRole(ethers.utils.id("TOKEN_SETTER_ROLE"), owner.address);
    await contract
      .connect(owner)
      .addTokenInfo(
        contractCENO.address,
        360,
        1,
        ethers.utils.parseEther("450000000")
      );

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
  });
});
