import { hardhatArguments } from "hardhat";
import { deployNetwork } from "./deploy.const";

export type ContractDeployAddress = string | null;

interface ContractDeployAddressInterface {
  Greeter?: ContractDeployAddress;

  USDT?: ContractDeployAddress;

  XYGameUSDT?: ContractDeployAddress;
  USDTFaucet?: ContractDeployAddress;
  TokenCENO?: ContractDeployAddress;
  TokenZOIC?: ContractDeployAddress;
  TokenDeposit?: ContractDeployAddress;
  TokenTreasury?: ContractDeployAddress;
  TokenRedeem?: ContractDeployAddress;
  TokenVeZOIC?: ContractDeployAddress;

  ZOICTokenCoffer?: ContractDeployAddress;
  TokenCofferAirdrop?: ContractDeployAddress;
  TokenCofferIDOVesting?: ContractDeployAddress;
  TokenCofferIDOToTGE?: ContractDeployAddress;
  TokenCofferIDOLinnerRelease?: ContractDeployAddress;
  TokenZOICIDOVestingByTime?: ContractDeployAddress;
  PlayersVestingDecayByWeek?: ContractDeployAddress;
  TokenCofferPlayers?: ContractDeployAddress;
  DevsVestingDecayByWeek?: ContractDeployAddress;
  TokenCofferDevs?: ContractDeployAddress;
  StakingRewardsVestingDecayByWeek?: ContractDeployAddress;
  TokenCofferStakingRewards?: ContractDeployAddress;
  TeamVestingDecayByWeek?: ContractDeployAddress;
  TokenCofferTeam?: ContractDeployAddress;

  GameTokenCoffer?: ContractDeployAddress;
  PoolTokenCoffer?: ContractDeployAddress;
  VaultTokenCoffer?: ContractDeployAddress;
  TeamTokenCoffer?: ContractDeployAddress;
  TokenCofferPaymentSplitter?: ContractDeployAddress;
  Year1VestingByTimeWallet?: ContractDeployAddress;
}

const ContractDeployAddress_ETHTestNet: ContractDeployAddressInterface = {
  Greeter: null,

  USDT: null,

  XYGameUSDT: "0xf3e54ed5E6BAFd203bCc4316663bAe0Bf0100811",
  USDTFaucet: "0x861eC40cF915A2036617272a81ed16b339952E51",
  TokenCENO: "0xd7dA0eb37ac4AFBa74ce8DEBB03A8caa09177378",
  TokenZOIC: null,
  TokenDeposit: "0x2a2370af0E7928Ac6D8f03fF9EDc150d02c6D2Be",
  TokenTreasury: "0xC2f178B40C0741ead0309B13040326B3014B1F06",
  TokenRedeem: "0x82178F55690fe80f0664d6AD3BD16a273e3ff3Ab",

  ZOICTokenCoffer: "0x199D69090b609175770920cEb056c65822F71529",
  // 2.5% of total supply
  TokenCofferAirdrop: null,
  // 2.5% of total supply
  TokenCofferIDOToTGE: null,
  // ido token vesting release first mint to
  TokenCofferIDOVesting: null,
  // ido release to, total amount 2.5% of total supply when released over 21 days TokenZOICIDOVestingByTime->TokenCofferIDOLinnerRelease
  TokenCofferIDOLinnerRelease: null,
  // 2.5% of total supply, release in 21 days
  TokenZOICIDOVestingByTime: null,
  // 52% of total supply, release in 360 weeks, decay 1% per week
  PlayersVestingDecayByWeek: null,
  TokenCofferPlayers: null,
  // 15.5% of total supply, release in 360 weeks,
  DevsVestingDecayByWeek: null,
  TokenCofferDevs: null,
  // 15% of total supply, release in 360 weeks,
  StakingRewardsVestingDecayByWeek: null,
  TokenCofferStakingRewards: null,
  // 10% of total supply, release in 360 weeks,
  TeamVestingDecayByWeek: null,
  TokenCofferTeam: null,

  GameTokenCoffer: "0xc64c53Bc7047e3caE33F1b175e6261754F96e5F3",
  PoolTokenCoffer: "0x6a8424a3e8b9d0bFfFB910f264C2fdD66D9D3ecf",
  VaultTokenCoffer: "0xcCC65943a9fd1125F2717549Ba810279450607B9",
  TeamTokenCoffer: "0x8348cbd49B64d85a8488e40D8Efc7B76EEFa0fa1",

  TokenCofferPaymentSplitter: "0x4d76295B951342DF124e264bd6d9a77B2a962072",
  Year1VestingByTimeWallet: "0x38A6DFa6DB41B8B1851b058e26F74305044199ed",
  TokenVeZOIC: "0xD260F08e3639a1A9E5684967ab4eb41C02912930",
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
