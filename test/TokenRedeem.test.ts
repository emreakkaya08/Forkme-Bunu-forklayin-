import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('TokenRedeem', async () => {
  let contract: Contract;
  let usdtContract: Contract;
  let tokenCENO: Contract;
  let tokenZOIC: Contract;

  let userAddress: SignerWithAddress;

  beforeEach(async () => {
    const USDT = await ethers.getContractFactory('XYGameUSDT');
    usdtContract = await upgrades.deployProxy(USDT, []);
    await usdtContract.deployed();

    const TokenTreasury = await ethers.getContractFactory('TokenTreasury');
    const treasury = await upgrades.deployProxy(TokenTreasury, []);
    await treasury.deployed();

    usdtContract.mint(treasury.address, ethers.utils.parseEther('10000000'));

    const TokenCENO = await ethers.getContractFactory('TokenCENO');
    tokenCENO = await upgrades.deployProxy(TokenCENO, []);
    await tokenCENO.deployed();

    const TokenZoicCoffer = await ethers.getContractFactory('TokenCoffer');
    const tokenZoicCoffer = await upgrades.deployProxy(TokenZoicCoffer, []);
    await tokenZoicCoffer.deployed();

    const TokenZOIC = await ethers.getContractFactory('TokenZOIC');
    tokenZOIC = await upgrades.deployProxy(TokenZOIC, [
      tokenZoicCoffer.address,
    ]);
    await tokenZOIC.deployed();

    const [owner, addr1] = await ethers.getSigners();
    userAddress = addr1;

    tokenCENO.mint(owner.address, ethers.utils.parseEther('9000'));
    tokenZoicCoffer.grantRole(ethers.utils.id('WITHDRAW'), owner.address);
    tokenZoicCoffer
      .connect(owner)
      .withdrawERC20(
        tokenZoicCoffer.address,
        userAddress.address,
        ethers.utils.parseEther('1000')
      );

    const TokenRedeemContract = await ethers.getContractFactory('TokenRedeem');
    contract = await upgrades.deployProxy(TokenRedeemContract, [
      treasury.address,
    ]);
    await contract.deployed();
  });

  it('TokenRedeem Test', async () => {
    expect(contract).to.be.instanceOf(Contract);
  });

  it('TokenRedeem change redeem token pair', async () => {
    const [owner, addr1] = await ethers.getSigners();

    expect(
      await contract
        .connect(owner)
        .addRedeemTokenPair(
          tokenCENO.address,
          tokenZOIC.address,
          usdtContract.address,
          9
        )
    ).to.be.revertedWith('');

    await contract.grantRole(ethers.utils.id('ADMIN'), owner.address);
  });
});
