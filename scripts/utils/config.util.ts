import 'dotenv/config';
import { hardhatArguments } from 'hardhat';
import { deployNetwork } from '../consts/deploy.const';

export interface RuntimeConfig {
  network: string;

  upgradeDefenderMultiSigAddress?: string;
}

export function getRuntimeConfig(): RuntimeConfig {
  const network = hardhatArguments.network;
  switch (network) {
    case deployNetwork.bsc_testnet:
      return getRuntimeConfigBscTestNet();
    case deployNetwork.bsc_mainnet:
      return getRuntimeConfigBscMainNet();
    case deployNetwork.arbitrum_testnet:
      return getRuntimeConfigArbitrumTestNet();
    case deployNetwork.arbitrum_mainnet:
      return getRuntimeConfigArbitrumMainNet();
    case deployNetwork.eth_testnet:
      return getRuntimeConfigETHTestNet();
    case deployNetwork.eth_mainnet:
      return getRuntimeConfigETHMainNet();
    default:
      throw new Error(`Network ${network} is not supported`);
  }
}

function getRuntimeConfigBscTestNet(): RuntimeConfig {
  return {
    network: 'bsc_testnet',
  };
}

function getRuntimeConfigBscMainNet(): RuntimeConfig {
  return {
    network: 'bsc_mainnet',
  };
}

function getRuntimeConfigArbitrumTestNet(): RuntimeConfig {
  return {
    network: 'arbitrum_testnet',
  };
}

function getRuntimeConfigArbitrumMainNet(): RuntimeConfig {
  return {
    network: 'arbitrum_mainnet',
  };
}

function getRuntimeConfigETHTestNet(): RuntimeConfig {
  return {
    network: 'eth_testnet',
  };
}

function getRuntimeConfigETHMainNet(): RuntimeConfig {
  return {
    network: 'eth_mainnet',
  };
}
