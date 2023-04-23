import * as zksync from "zksync-web3";
import {expect} from "chai";
import {Contract} from 'ethers';
import {ethers, upgrades} from 'hardhat';

describe('ZkSyncDemo', function () {
    //account3 balance 0.05eth
    // const PRIVATE_KEY = '67195c963ff445314e667112ab22f4a7404bad7f9746564eb409b9bb8c6aed32';

    // it('Zk L1 -> L2 ', async function () {
    //     // zksync l1 转账 l2
    //     const zkSyncProvider = new zksync.Provider("https://testnet.era.zksync.dev");

    //     const ethProvider = ethers.getDefaultProvider("goerli");

    //     const zkSyncWallet = new zksync.Wallet(PRIVATE_KEY, zkSyncProvider, ethProvider);

    //     console.log("zkSyncWallet init done");

    //     const deposit = await zkSyncWallet.deposit({
    //         token: zksync.utils.ETH_ADDRESS,
    //         amount: ethers.utils.parseEther("0.001"),
    //     });
    //     // 提交事务句柄信息
    //     const ethereumTxReceipt = await deposit.waitL1Commit();
    //     const depositReceipt = await deposit.wait();
    //     console.log('ethereumTxReceipt : ', ethereumTxReceipt);
    //     console.log('depositReceipt : ', depositReceipt);


    //     // Retrieving the current (committed) zkSync ETH balance of an account
    //     const committedEthBalance = await zkSyncWallet.getBalance(zksync.utils.ETH_ADDRESS);
    //     console.log('committedEthBalance : ', committedEthBalance);

    //     // Retrieving the ETH balance of an account in the last finalized zkSync block.
    //     const finalizedEthBalance = await zkSyncWallet.getBalance(zksync.utils.ETH_ADDRESS, "finalized");
    //     console.log('finalizedEthBalance : ', finalizedEthBalance);

    // });
    it('should get balance ', async function () {

        const PRIVATE_KEY = "0xc8acb475bb76a4b8ee36ea4d0e516a755a17fad2e84427d5559b37b544d9ba5a";

        const zkSyncProvider = new zksync.Provider("https://testnet.era.zksync.dev");
        const ethereumProvider = ethers.getDefaultProvider("goerli");
        const wallet = new zksync.Wallet(PRIVATE_KEY, zkSyncProvider);

        const USDC_ADDRESS = "0xd35CCeEAD182dcee0F148EbaC9447DA2c4D449c4";

        // Getting balance in USDC
        console.log("USDC balance :", await wallet.getBalanceL1(USDC_ADDRESS));

        // Getting balance in ETH
        console.log("ETH balance :", await wallet.getBalanceL1());

    });


    

});