import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

function getMessageHash(to: string, value: BigNumber, msg: string) {
  const messageHash = ethers.utils.solidityKeccak256(
    ['address', 'uint256', 'string'],
    [to, value, msg]
  );

  return ethers.utils.arrayify(messageHash);
}

describe('SignMessage', function () {
  it('SignMessage Test', async function () {
    const [signer1, signer2] = await ethers.getSigners();
    expect(signer1).to.be.instanceOf(ethers.Signer);

    const message = 'Hello World';
    const signedMessage = await signer1.signMessage(message);

    const signedData = {
      address: signer1.address,
      msg: message,
      sig: signedMessage,
      version: '2',
    };

    const signedAddress = ethers.utils.verifyMessage(
      signedData.msg,
      signedData.sig
    );
    expect(signedAddress).to.equal(signedData.address);

    const [owner] = await ethers.getSigners();
    const hash = getMessageHash(
      owner.address,
      ethers.utils.parseEther('0'),
      'Hi, you!'
    );
    const signature = await owner.signMessage(hash);
    expect(ethers.utils.verifyMessage(hash, signature)).to.equal(owner.address);
  });
});
