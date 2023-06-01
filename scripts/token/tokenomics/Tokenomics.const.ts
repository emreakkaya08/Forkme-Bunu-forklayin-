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
const WEEK = 7 * DAY;

// 2023-07-01 00:00:00 UTC
export const ZOIC_RELEASE_START_TIME = 1686115200;

export const ZOIC_RELEASE_WEEKS = 360 * WEEK;

export const ZOIC_RELEASE_WEEKLY_DECAY = 1;

// 2023-07-01 00:00:00 UTC
export const IDO_RELEASE_START_TIME = 1686115200;

export const IDO_RELEASE_DURATION = 21 * DAY;
