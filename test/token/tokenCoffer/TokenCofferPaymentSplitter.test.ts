import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';

describe('TokenCofferPaymentSplitter', async () => {
  let contract: Contract;
  let cenoToken: Contract;

  beforeEach(async () => {
    const TokenCENOContract = await ethers.getContractFactory('TokenCENO');
    cenoToken = await upgrades.deployProxy(TokenCENOContract, []);
    await cenoToken.deployed();

    const [owner, gameCoffer, poolCoffer, vaultCoffer, teamCoffer] =
      await ethers.getSigners();
    const TokenCofferPaymentSplitterContract = await ethers.getContractFactory(
      'TokenCofferPaymentSplitter'
    );
    contract = await upgrades.deployProxy(TokenCofferPaymentSplitterContract, [
      [
        gameCoffer.address,
        poolCoffer.address,
        vaultCoffer.address,
        teamCoffer.address,
      ],
      [53, 20, 17, 10],
    ]);
    await contract.deployed();
  });

  it('TokenCofferPaymentSplitter Test', async () => {
    expect(contract).to.be.instanceOf(Contract);
  });

  it('TokenCofferPaymentSplitter: ERC20 pay test', async () => {
    const [owner, gameCoffer, poolCoffer, vaultCoffer, teamCoffer] =
      await ethers.getSigners();
    const amount = ethers.utils.parseEther('100');
    await cenoToken.mint(contract.address, amount);

    expect(await cenoToken.balanceOf(contract.address)).to.equal(amount);

    await contract
      .connect(owner)
      .releaseERC20(cenoToken.address, gameCoffer.address);
    await contract
      .connect(owner)
      .releaseERC20(cenoToken.address, poolCoffer.address);
    await contract
      .connect(owner)
      .releaseERC20(cenoToken.address, vaultCoffer.address);
    await contract
      .connect(owner)
      .releaseERC20(cenoToken.address, teamCoffer.address);

    expect(await cenoToken.balanceOf(gameCoffer.address)).to.equal(
      ethers.utils.parseEther('53')
    );
    expect(await cenoToken.balanceOf(poolCoffer.address)).to.equal(
      ethers.utils.parseEther('20')
    );
    expect(await cenoToken.balanceOf(vaultCoffer.address)).to.equal(
      ethers.utils.parseEther('17')
    );
    expect(await cenoToken.balanceOf(teamCoffer.address)).to.equal(
      ethers.utils.parseEther('10')
    );

    expect(await cenoToken.balanceOf(contract.address)).to.equal(
      ethers.utils.parseEther('0')
    );
  });

  it('TokenCofferPaymentSplitter: ETH pay test', async () => {
    const [owner, gameCoffer, poolCoffer, vaultCoffer, teamCoffer] =
      await ethers.getSigners();
    const amount = ethers.utils.parseEther('100');

    await owner.sendTransaction({
      to: contract.address,
      value: amount,
    });

    expect(await ethers.provider.getBalance(contract.address)).to.equal(
      ethers.utils.parseEther('100')
    );
    const balanceBeforeGameCofferETH = await ethers.provider.getBalance(
      gameCoffer.address
    );
    const balanceBeforePoolCofferETH = await ethers.provider.getBalance(
      poolCoffer.address
    );
    const balanceBeforeVaultCofferETH = await ethers.provider.getBalance(
      vaultCoffer.address
    );
    const balanceBeforeTeamCofferETH = await ethers.provider.getBalance(
      teamCoffer.address
    );

    await contract.connect(owner).releaseETH(gameCoffer.address);
    await contract.connect(owner).releaseETH(poolCoffer.address);
    await contract.connect(owner).releaseETH(vaultCoffer.address);
    await contract.connect(owner).releaseETH(teamCoffer.address);

    expect(await ethers.provider.getBalance(contract.address)).to.equal(
      ethers.utils.parseEther('0')
    );

    expect(await ethers.provider.getBalance(gameCoffer.address)).to.equal(
      balanceBeforeGameCofferETH.add(ethers.utils.parseEther('53'))
    );
    expect(await ethers.provider.getBalance(poolCoffer.address)).to.equal(
      balanceBeforePoolCofferETH.add(ethers.utils.parseEther('20'))
    );
    expect(await ethers.provider.getBalance(vaultCoffer.address)).to.equal(
      balanceBeforeVaultCofferETH.add(ethers.utils.parseEther('17'))
    );
    expect(await ethers.provider.getBalance(teamCoffer.address)).to.equal(
      balanceBeforeTeamCofferETH.add(ethers.utils.parseEther('10'))
    );
  });
});
