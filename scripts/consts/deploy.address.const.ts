import { hardhatArguments } from 'hardhat';
import { deployNetwork } from './deploy.const';

type ContractDeployAddress = string | null;

interface ContractDeployAddressInterface {
  Greeter?: ContractDeployAddress;
  XToken?: ContractDeployAddress;
  YToken?: ContractDeployAddress;
  XYGameUSDT?: ContractDeployAddress;
  USDTFaucet?: ContractDeployAddress;
  StableTokenX?: ContractDeployAddress;
  ZOICToken?: ContractDeployAddress;
  TokenDeposit?: ContractDeployAddress;
  TokenTreasury?: ContractDeployAddress;
  RedeemU?: ContractDeployAddress;
}

const ContractDeployAddress_ETHTestNet: ContractDeployAddressInterface = {
  Greeter: null,
  XYGameUSDT: '0xf3e54ed5E6BAFd203bCc4316663bAe0Bf0100811',
  USDTFaucet: '0x861eC40cF915A2036617272a81ed16b339952E51',
  XToken: '0x9389023C56ed52f0Da18571500149d50430e7a1A',
  YToken: '0xa5bb1f61C8CFc133Bea27127565eB21B2C458CC3',
  StableTokenX: '0x51e49799490A4469fb73edFC09822b3b566cE445',
  ZOICToken: null,
  TokenDeposit: '0xC077028f5396bd89f5FA1eB36772809974A51F10',
  TokenTreasury: '0xCA7BE8Ad675e77B8edF0D40ceE28bB4d3dC93E38',
  RedeemU: '0xaA71fe67B4c503ec5541661BBe16F9a03988019E',
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
