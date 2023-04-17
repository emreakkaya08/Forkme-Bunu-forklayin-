import { hardhatArguments } from 'hardhat';
import { deployNetwork } from './deploy.const';

type ContractDeployAddress = string | null;

interface ContractDeployAddressInterface {
  XToken?: ContractDeployAddress;
  YToken?: ContractDeployAddress;
  StableTokenX?: ContractDeployAddress;
  TokenDeposit?: ContractDeployAddress;
  Greeter?: ContractDeployAddress;
}

const ContractDeployAddress_ETHTestNet: ContractDeployAddressInterface = {
  XToken: null,
  YToken: null,
  StableTokenX: '0x51e49799490A4469fb73edFC09822b3b566cE445',
  TokenDeposit: '0x6550755AEE41CC87E72A849Fdf9022aa74DEC1F4',
  Greeter: null,
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
