import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, network, upgrades } from "hardhat";

describe("USDTFaucet", function () {
  let xyGameUSDT: Contract;
  let usdtFaucet: Contract;
  beforeEach(async () => {
    const XYGameUSDT = await ethers.getContractFactory("XYGameUSDT");
    xyGameUSDT = await upgrades.deployProxy(XYGameUSDT);
    await xyGameUSDT.deployed();

    const USDTFaucet = await ethers.getContractFactory("USDTFaucet");
    usdtFaucet = await upgrades.deployProxy(USDTFaucet, [xyGameUSDT.address]);
    await usdtFaucet.deployed();

    // Mint 1000 eth tokens to the faucet
    await xyGameUSDT.mint(usdtFaucet.address, ethers.utils.parseEther("1000"));
  });

  describe("USDTFaucet claim", async function () {
    let snapshotId: string;
    beforeEach(async () => {
      snapshotId = await ethers.provider.send("evm_snapshot", []);
    });
    afterEach(async () => {
      await ethers.provider.send("evm_revert", [snapshotId]);
    });

    it("success", async () => {
      const amount = ethers.utils.parseEther("100");
      const [owner, addr1] = await ethers.getSigners();
      await expect(usdtFaucet.connect(addr1).claim())
        .emit(usdtFaucet, "Faucet")
        .withArgs(addr1.address, amount);

      //check balance
      expect(await xyGameUSDT.balanceOf(addr1.address)).to.equal(amount);
    });

    it("success claim 2 days", async () => {
      const amount = ethers.utils.parseEther("100");
      const [owner, addr1] = await ethers.getSigners();
      usdtFaucet = usdtFaucet.connect(addr1);
      await expect(usdtFaucet.claim())
        .emit(usdtFaucet, "Faucet")
        .withArgs(addr1.address, amount);

      //check balance
      expect(await xyGameUSDT.balanceOf(addr1.address)).to.equal(amount);

      await network.provider.send("evm_increaseTime", [86400]);
      await usdtFaucet.claim().then(async (tx: any) => {
        await tx.wait();
      });

      //check balance
      expect(await xyGameUSDT.balanceOf(addr1.address)).to.equal(
        amount.add(amount)
      );
    });

    it("fail:claim 2 times", async () => {
      const [owner, addr1] = await ethers.getSigners();
      usdtFaucet = usdtFaucet.connect(addr1);

      await usdtFaucet.claim().then(async (tx: any) => {
        await tx.wait();
      });

      await expect(usdtFaucet.claim()).to.be.reverted;
    });
  });

  describe("USDTFaucet claimWithRole", async function () {
    let snapshotId: string;
    beforeEach(async () => {
      snapshotId = await ethers.provider.send("evm_snapshot", []);
    });
    afterEach(async () => {
      await ethers.provider.send("evm_revert", [snapshotId]);
    });

    it("success", async () => {
      const amount = ethers.utils.parseEther("100");
      const [owner, addr1] = await ethers.getSigners();
      await expect(usdtFaucet.claimWithRole(addr1.address))
        .emit(usdtFaucet, "Faucet")
        .withArgs(addr1.address, amount);

      //check balance
      expect(await xyGameUSDT.balanceOf(addr1.address)).to.equal(amount);
    });

    it("success claim 2 days", async () => {
      const amount = ethers.utils.parseEther("100");
      const [owner, addr1] = await ethers.getSigners();
      await usdtFaucet.claimWithRole(addr1.address).then(async (tx: any) => {
        await tx.wait();
      });

      //check balance
      expect(await xyGameUSDT.balanceOf(addr1.address)).to.equal(amount);

      await network.provider.send("evm_increaseTime", [86400]);
      await usdtFaucet.claimWithRole(addr1.address).then(async (tx: any) => {
        await tx.wait();
      });

      //check balance
      expect(await xyGameUSDT.balanceOf(addr1.address)).to.equal(
        amount.add(amount)
      );
    });
    it("fail:claim 2 times", async () => {
      const [owner, addr1] = await ethers.getSigners();

      await usdtFaucet.claimWithRole(addr1.address).then(async (tx: any) => {
        await tx.wait();
      });

      await expect(usdtFaucet.claimWithRole(addr1.address)).to.be.reverted;
    });
  });

  describe("USDTFaucet claimAmountWithRole", async function () {
    it("success", async () => {
      const [owner, addr1] = await ethers.getSigners();
      const amount = ethers.utils.parseEther("1000");
      await expect(usdtFaucet.claimAmountWithRole(addr1.address, amount))
        .emit(usdtFaucet, "Faucet")
        .withArgs(addr1.address, amount);

      //check balance
      expect(await xyGameUSDT.balanceOf(addr1.address)).to.equal(amount);
    });

    it("fail:claim 2 times", async () => {
      const [owner, addr1] = await ethers.getSigners();
      const amount = ethers.utils.parseEther("1000");
      await usdtFaucet
        .claimAmountWithRole(addr1.address, amount)
        .then(async (tx: any) => {
          await tx.wait();
        });

      await expect(usdtFaucet.claimAmountWithRole(addr1.address, amount)).to.be
        .reverted;
    });

    it("fail:claim zero amount", async () => {
      const [owner, addr1] = await ethers.getSigners();
      const amount = ethers.utils.parseEther("0");
      await expect(usdtFaucet.claimAmountWithRole(addr1.address, amount)).to.be
        .reverted;
    });

    it("fail:claim to zero address", async () => {
      const [owner, addr1] = await ethers.getSigners();
      const amount = ethers.utils.parseEther("1000");
      await expect(
        usdtFaucet.claimAmountWithRole(ethers.constants.AddressZero, amount)
      ).to.be.reverted;
    });
  });
});
