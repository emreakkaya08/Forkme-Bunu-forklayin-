import { expect } from "chai";
import { ethers } from "hardhat";

describe("SignMessage", function () {
  it("SignMessage Test", async function () {
    const [signer1, signer2] = await ethers.getSigners();
    expect(signer1).to.be.instanceOf(ethers.Signer);

    const message = "Hello World";
    const signedMessage = await signer1.signMessage(message);

    const signedData = {
      address: signer1.address,
      msg: message,
      sig: signedMessage,
      version: "2",
    };

    const signedAddress = ethers.utils.verifyMessage(
      signedData.msg,
      signedData.sig
    );
    expect(signedAddress).to.equal(signedData.address);
  });
});
