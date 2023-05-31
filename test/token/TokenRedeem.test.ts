import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('TokenRedeem', async () => {
  let contract: Contract;
  let usdtContract: Contract;
  let tokenCENO: Contract;
  let tokenZOIC: Contract;
  let treasury: Contract;

  let userAddress: SignerWithAddress;

  beforeEach(async () => {
    const USDT = await ethers.getContractFactory('XYGameUSDT');
    usdtContract = await upgrades.deployProxy(USDT, []);
    await usdtContract.deployed();

    const TokenTreasury = await ethers.getContractFactory('TokenTreasury');
    treasury = await upgrades.deployProxy(TokenTreasury, []);
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

    tokenCENO.mint(userAddress.address, ethers.utils.parseEther('9000'));
    tokenZoicCoffer.grantRole(ethers.utils.id('WITHDRAW'), owner.address);
    tokenZoicCoffer
      .connect(owner)
      .withdrawERC20(
        tokenZOIC.address,
        userAddress.address,
        ethers.utils.parseEther('1000')
      );

    const TokenRedeemContract = await ethers.getContractFactory('TokenRedeem');
    contract = await upgrades.deployProxy(TokenRedeemContract, [
      treasury.address,
    ]);
    await contract.deployed();
    treasury.grantRole(ethers.utils.id('WITHDRAW'), contract.address);
  });

  it('TokenRedeem Test', async () => {
    expect(contract).to.be.instanceOf(Contract);
  });

  it('TokenRedeem change redeem token pair', async () => {
    const [owner, addr1] = await ethers.getSigners();

    const noRole = `AccessControl: account ${ethers.utils
      .getAddress(owner.address)
      .toLowerCase()} is missing role ${ethers.utils.id('ADMIN')}`;
    await expect(
      contract
        .connect(owner)
        .addRedeemTokenPair(
          tokenCENO.address,
          tokenZOIC.address,
          usdtContract.address,
          9
        )
    ).to.be.revertedWith(noRole);

    await contract.grantRole(ethers.utils.id('ADMIN'), owner.address);

    await contract
      .connect(owner)
      .addRedeemTokenPair(
        tokenCENO.address,
        tokenZOIC.address,
        usdtContract.address,
        9
      );

    expect(
      await contract
        .connect(owner)
        .hasRedeemTokenPair(
          tokenCENO.address,
          tokenZOIC.address,
          usdtContract.address
        )
    ).to.be.true;
  });

  it('TokenRedeem redeemERC20', async () => {
    const [owner, addr1] = await ethers.getSigners();
    await contract.grantRole(ethers.utils.id('ADMIN'), owner.address);

    await contract
      .connect(owner)
      .addRedeemTokenPair(
        tokenCENO.address,
        tokenZOIC.address,
        usdtContract.address,
        9
      );

    const totalX = await tokenCENO.balanceOf(userAddress.address);
    const totalY = await tokenZOIC.balanceOf(userAddress.address);

    expect(totalX).to.equal(ethers.utils.parseEther('9000'));
    expect(totalY).to.equal(ethers.utils.parseEther('1000'));

    tokenCENO.connect(userAddress).approve(contract.address, totalX);
    tokenZOIC.connect(userAddress).approve(contract.address, totalY);

    const xAmount = ethers.utils.parseEther('9');
    const yAmount = ethers.utils.parseEther('9').div(9);
    const UsdtAmount = ethers.utils
      .parseEther('9')
      .div(9)
      .div(10)
      .add(ethers.utils.parseEther('9'));

    const withdrawERC20Role = ethers.utils.id('WITHDRAW_ERC20');
    const revert = `AccessControl: account ${ethers.utils
      .getAddress(contract.address)
      .toLowerCase()} is missing role ${withdrawERC20Role}`;

    await expect(
      contract
        .connect(userAddress)
        .redeemERC20(
          tokenCENO.address,
          tokenZOIC.address,
          usdtContract.address,
          ethers.utils.parseEther('9')
        )
    ).to.be.revertedWith(revert);

    await treasury.grantRole(withdrawERC20Role, contract.address);

    await expect(
      contract
        .connect(userAddress)
        .redeemERC20(
          tokenCENO.address,
          tokenZOIC.address,
          usdtContract.address,
          ethers.utils.parseEther('9')
        )
    )
      .to.emit(contract, 'RedeemERC20')
      .withArgs(
        usdtContract.address,
        userAddress.address,
        xAmount,
        yAmount,
        UsdtAmount
      );

    expect(await usdtContract.balanceOf(userAddress.address)).to.be.equal(
      UsdtAmount
    );
  });
});
