// total supply of ZOIC
export const TOTAL_SUPPLY_ZOIC = 1000000000;

export const SupplyDistribution = {
  // 2.5% of total supply
  Airdrop: 250,
  // 2.5% of total supply
  IDOToTGE: 250,
  // ido release to, total amount 2.5% of total supply when released over 21 days
  IDOLinnerRelease: 250,
  // 52% of total supply, release in 360 weeks, decay 1% per week
  Players: 5200,
  // 15.5% of total supply, release in 360 weeks,
  Devs: 1550,
  // 15% of total supply, release in 360 weeks,
  StakingRewards: 1500,
  // 10% of total supply, release in 360 weeks,
  Team: 1000,
};

const DAY = 24 * 60 * 60;
export const A_WEEK = 7 * DAY;

// 2023-07-01 00:00:00 UTC
const ZOIC_RELEASE_START_TIME = 1686115200;

export const ZoicReleaseStartTime = {
  //TODO release start time for players vesting, it can be different from ZOIC_RELEASE_START_TIME
  Players: ZOIC_RELEASE_START_TIME,
  //TODO release start time for devs vesting, it can be different from ZOIC_RELEASE_START_TIME
  Devs: ZOIC_RELEASE_START_TIME,
  //TODO release start time for staking rewards vesting, it can be different from ZOIC_RELEASE_START_TIME
  StakingRewards: ZOIC_RELEASE_START_TIME,
  //TODO release start time for team vesting, it can be different from ZOIC_RELEASE_START_TIME
  Team: ZOIC_RELEASE_START_TIME,
};

export const TOTAL_RELEASE_WEEKS = 360;

export const ZOIC_RELEASE_WEEKS_DURATION = TOTAL_RELEASE_WEEKS * A_WEEK;

export const ZOIC_RELEASE_WEEKLY_DECAY_PERCENT = 1;

// 2023-07-01 00:00:00 UTC
export const IDO_RELEASE_START_TIME = 1686115200;

export const IDO_RELEASE_DURATION = 21 * DAY;

export const getSupplyOf = (supplyDistribution: number) => {
  return parseInt(
    ((TOTAL_SUPPLY_ZOIC * supplyDistribution) / 10000).toString()
  );
};
