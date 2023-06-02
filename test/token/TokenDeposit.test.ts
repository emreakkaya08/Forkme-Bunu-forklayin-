import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";

describe("TokenDeposit", () => {
  let contract: Contract;
  let tokenTreasury: Contract;
  let cenoToken: Contract;
  let usdt: Contract;

  beforeEach(async () => {
    const CenoToken = await ethers.getContractFactory("TokenCENO");
    cenoToken = await upgrades.deployProxy(CenoToken, []);
    await cenoToken.deployed();

    const TokenTreasury = await ethers.getContractFactory("TokenTreasury");
    tokenTreasury = await upgrades.deployProxy(TokenTreasury, []);
    await tokenTreasury.deployed();

    const TokenDeposit = await ethers.getContractFactory("TokenDeposit");
    contract = await upgrades.deployProxy(TokenDeposit, [
      cenoToken.address,
      tokenTreasury.address,
    ]);
    await contract.deployed();

    const USDTContract = await ethers.getContractFactory("XYGameUSDT");
    usdt = await upgrades.deployProxy(USDTContract, []);
    await usdt.deployed();
  });

  it("contract to be defined", async () => {
    expect(contract).to.be.instanceOf(Contract);
  });

  it("TokenDeposit addExchangeRate test", async () => {
    await expect(contract.getExchangeRate(usdt.address)).to.be.revertedWith(
      "Token not supported"
    );
    const [owner, addr1] = await ethers.getSigners();
    const rate = 100;

    const role = ethers.utils.id("ADMIN");
    const revert = `AccessControl: account ${ethers.utils
      .getAddress(addr1.address)
      .toLowerCase()} is missing role ${role}`;
    await expect(
      contract.connect(addr1).addExchangeRate(usdt.address, rate)
    ).to.be.revertedWith(revert);

    await contract.grantRole(role, addr1.address);
    await contract.connect(addr1).addExchangeRate(usdt.address, rate);

    expect(await contract.getExchangeRate(usdt.address)).to.equal(rate);

    await expect(
      contract.connect(addr1).addExchangeRate(usdt.address, rate)
    ).to.be.revertedWith("Token already exists");
  });

  it("TokenDeposit DepositERC20 test", async () => {
    const rate = 100;
    await contract.addExchangeRate(usdt.address, rate);

    // grant contract MINTER_ROLE
    await cenoToken.grantRole(ethers.utils.id("MINTER_ROLE"), contract.address);

    const [owner, from] = await ethers.getSigners();
    const uAmount = ethers.utils.parseEther("100");
    await usdt.mint(from.address, uAmount);

    expect(await usdt.balanceOf(from.address)).to.equal(uAmount);

    const swapAmount = ethers.utils.parseEther("20");

    const emptyAmount = ethers.utils.parseEther("0");
    expect(await usdt.balanceOf(contract.address)).to.equal(emptyAmount);

    await usdt.connect(from).approve(contract.address, swapAmount);
    await expect(contract.connect(from).depositERC20(usdt.address, swapAmount))
      .to.emit(contract, "DepositERC20")
      .withArgs(from.address, swapAmount, swapAmount.mul(rate));

    expect(await usdt.balanceOf(contract.address)).to.equal(emptyAmount);
    expect(await usdt.balanceOf(tokenTreasury.address)).to.equal(swapAmount);

    expect(await usdt.balanceOf(from.address)).to.equal(
      uAmount.sub(swapAmount)
    );
    const balance = await cenoToken.balanceOf(from.address);
    expect(await cenoToken.balanceOf(from.address)).to.equal(
      swapAmount.mul(rate)
    );
  });
});
