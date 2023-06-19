import { expect } from "chai";
import exp from "constants";
import { BigNumber, Contract } from "ethers";
import { ethers, upgrades } from "hardhat";

describe("GameFactory", async () => {
  let contract: Contract;
  let templateContract: Contract;

  beforeEach(async () => {
    const GameTemplateContract = await ethers.getContractFactory("GameAccount");
    templateContract = await upgrades.deployProxy(GameTemplateContract, [
      "xygame-tpl",
    ]);
    await templateContract.deployed();

    const GameFactoryContract = await ethers.getContractFactory("GameFactory");
    contract = await upgrades.deployProxy(GameFactoryContract, [
      templateContract.address,
    ]);
    await contract.deployed();
  });

  it("GameFactory Test", async () => {
    expect(contract).to.be.instanceOf(Contract);
  });

  it("GameFactory register Test", async () => {
    const [owner, game1, game2, game3] = await ethers.getSigners();

    expect(await contract.connect(game1).register("game1")).to.emit(
      contract,
      "GameRegistered"
    );

    const account1 = await contract.connect(game1).getGameAccount();
    const accountGameFC = await ethers.getContractFactory("GameAccount");
    const accountGame1 = await accountGameFC.attach(account1);

    expect(await contract.connect(game2).register("game2")).to.emit(
      contract,
      "GameRegistered"
    );
    const account2 = await contract.connect(game2).getGameAccount();

    expect(await contract.connect(game3).register("game3")).to.emit(
      contract,
      "GameRegistered"
    );
    const account3 = await contract.connect(game3).getGameAccount();

    expect(account1).not.to.equal(account2);
    expect(account1).not.to.equal(account3);
    expect(account2).not.to.equal(account3);

    expect(await contract.totalRegistered()).to.equal(BigNumber.from(3));
  });
});
