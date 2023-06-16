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

  TokenCofferAirdrop?: ContractDeployAddress;
  TokenCofferIDOVesting?: ContractDeployAddress;
  TokenCofferIDOToTGE?: ContractDeployAddress;
  TokenCofferIDOLinnerRelease?: ContractDeployAddress;
  TokenZOICIDOVestingByDay?: ContractDeployAddress;
  PlayersVestingDecayByWeek?: ContractDeployAddress;
  TokenCofferPlayers?: ContractDeployAddress;
  DevsVestingDecayByWeek?: ContractDeployAddress;
  TokenCofferDevs?: ContractDeployAddress;
  StakingRewardsVestingDecayByWeek?: ContractDeployAddress;
  TokenCofferStakingRewards?: ContractDeployAddress;
  TeamVestingDecayByWeek?: ContractDeployAddress;
  TokenCofferTeam?: ContractDeployAddress;

  NFTForRewardPointsSilverBox?: ContractDeployAddress;
  NFTForRewardPointsGoldenBox?: ContractDeployAddress;
  NFTForRewardPointsAmethystBox?: ContractDeployAddress;
  NFTMinterForRewardPoints?: ContractDeployAddress;

  GameAccountTemplate?: ContractDeployAddress;
  GameFactory?: ContractDeployAddress;
}

const ContractDeployAddress_ETHTestNet: ContractDeployAddressInterface = {
  Greeter: null,

  USDT: null,

  XYGameUSDT: "0xf3e54ed5E6BAFd203bCc4316663bAe0Bf0100811",
  USDTFaucet: "0x861eC40cF915A2036617272a81ed16b339952E51",
  TokenCENO: "0xd7dA0eb37ac4AFBa74ce8DEBB03A8caa09177378",
  TokenZOIC: "0xBD0a99e6B1F3B0b47A4F95B90Ba918Ae05Ae0644",
  TokenDeposit: "0x2a2370af0E7928Ac6D8f03fF9EDc150d02c6D2Be",
  // use for usdt of zoic ... , use as vault
  TokenTreasury: "0xC2f178B40C0741ead0309B13040326B3014B1F06",
  TokenRedeem: "0x82178F55690fe80f0664d6AD3BD16a273e3ff3Ab",

  // 2.5% of total supply
  TokenCofferAirdrop: "0x0185D5968928F7C57E66b669802c3CD53B08f2c0",
  // 2.5% of total supply
  TokenCofferIDOToTGE: "0xAfF7508aa99322Dd53Ea49FbD1CB297CD79BE501",
  // ido token vesting release first mint to
  TokenCofferIDOVesting: "0x9c82A1AeD85Db7E2f5F82EFd7Cc57A293f3F06D2",
  // ido release to, total amount 2.5% of total supply when released over 21 days TokenZOICIDOVestingByTime->TokenCofferIDOLinnerRelease
  TokenCofferIDOLinnerRelease: "0xAb4d40390d31E82C64D044ECE91727850ec84657",
  // 2.5% of total supply, release in 21 days
  TokenZOICIDOVestingByDay: null,
  // 52% of total supply, release in 360 weeks, decay 1% per week
  PlayersVestingDecayByWeek: "0xeC7a14C3b440278ab41640d4902639F830206847",
  TokenCofferPlayers: "0x79aceefD4Bc5743d57939d7c06C4E7FdCAe1566e",
  // 15.5% of total supply, release in 360 weeks,
  DevsVestingDecayByWeek: "0x5C47f870F90E72c5b77c8Fcd7134dBeA3ec4E8B3",
  TokenCofferDevs: "0x76B4f7DBf864F7919466aC64e1344Fa276ccaeb3",
  // 15% of total supply, release in 360 weeks,
  StakingRewardsVestingDecayByWeek:
    "0xf3557Fea44c4C3134589516229b4f772e84649f2",
  TokenCofferStakingRewards: "0xaa686d37A765BC5f67F0EA93a9804Eaa84E77Dca",
  // 10% of total supply, release in 360 weeks,
  TeamVestingDecayByWeek: "0x8330e53605F1cFec64461eE7f7Eb3EB0709e6C1C",
  TokenCofferTeam: "0x71f72C61551A2A14a8e147165e8bcA984a97616A",

  TokenVeZOIC: "0xD260F08e3639a1A9E5684967ab4eb41C02912930",

  NFTForRewardPointsSilverBox: null,
  NFTForRewardPointsGoldenBox: null,
  NFTForRewardPointsAmethystBox: null,
  NFTMinterForRewardPoints: null,

  GameAccountTemplate: null,
  GameFactory: null,
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
