import { hardhatArguments } from 'hardhat';
import { deployNetwork } from './deploy.const';

export type ContractDeployAddress = string | null;

interface ContractDeployAddressInterface {
  Greeter?: ContractDeployAddress;
  XToken?: ContractDeployAddress;
  YToken?: ContractDeployAddress;
  XYGameUSDT?: ContractDeployAddress;
  USDTFaucet?: ContractDeployAddress;
  TokenCENO?: ContractDeployAddress;
  TokenZOIC?: ContractDeployAddress;
  TokenDeposit?: ContractDeployAddress;
  TokenTreasury?: ContractDeployAddress;
  RedeemU?: ContractDeployAddress;

  ZOICTokenCoffer?: ContractDeployAddress;
  GameTokenCoffer?: ContractDeployAddress;
  PoolTokenCoffer?: ContractDeployAddress;
  VaultTokenCoffer?: ContractDeployAddress;
  TeamTokenCoffer?: ContractDeployAddress;
  TokenCofferPaymentSplitter?: ContractDeployAddress;
  Year1VestingByTimeWallet?: ContractDeployAddress;
}

const ContractDeployAddress_ETHTestNet: ContractDeployAddressInterface = {
  Greeter: null,
  XYGameUSDT: '0xf3e54ed5E6BAFd203bCc4316663bAe0Bf0100811',
  USDTFaucet: '0x861eC40cF915A2036617272a81ed16b339952E51',
  XToken: '0x9389023C56ed52f0Da18571500149d50430e7a1A',
  YToken: '0xa5bb1f61C8CFc133Bea27127565eB21B2C458CC3',
  TokenCENO: '0x858Bd29D36b5B62637963101258068892DDF49A7',
  TokenZOIC: '0x7eC668de7E159564FA61B33617eD42a4522a6b86',
  TokenDeposit: '0xC077028f5396bd89f5FA1eB36772809974A51F10',
  TokenTreasury: '0xCA7BE8Ad675e77B8edF0D40ceE28bB4d3dC93E38',
  RedeemU: '0xaA71fe67B4c503ec5541661BBe16F9a03988019E',

  ZOICTokenCoffer: '0x199D69090b609175770920cEb056c65822F71529',
  GameTokenCoffer: '0xc64c53Bc7047e3caE33F1b175e6261754F96e5F3',
  PoolTokenCoffer: '0x6a8424a3e8b9d0bFfFB910f264C2fdD66D9D3ecf',
  VaultTokenCoffer: '0xcCC65943a9fd1125F2717549Ba810279450607B9',
  TeamTokenCoffer: '0x8348cbd49B64d85a8488e40D8Efc7B76EEFa0fa1',

  TokenCofferPaymentSplitter: '0x4d76295B951342DF124e264bd6d9a77B2a962072',
  Year1VestingByTimeWallet: null,
};

const ContractDeployAddress_ETHMainNet: ContractDeployAddressInterface = {};

export function getContractDeployAddress(
  network?: string
): ContractDeployAddressInterface {
  let _ContractDeployAddress: ContractDeployAddressInterface = null as any;
  switch (network) {
    case deployNetwork.eth_testnet:
      _ContractDeployAddress = ContractDeployAddress_ETHTestNet;
      break;
    case deployNetwork.eth_mainnet:
      _ContractDeployAddress = ContractDeployAddress_ETHMainNet;
      break;
    default:
      _ContractDeployAddress = undefined as any;
      break;
  }
  return _ContractDeployAddress;
}

export const ContractDeployAddress: ContractDeployAddressInterface =
  getContractDeployAddress(hardhatArguments?.network) as any;
