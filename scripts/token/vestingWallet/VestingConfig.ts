export const ONE_YEAR = 60 * 60 * 24 * 365;
//utc0 2023-04-24 00:00:00
export const VESTING_START_TIME = 1682294400;

const initRate = 0.50794;
const TOTAL_ZOIC_TOKEN_AMOUNT = 204800000;
export const RELEASE_STEP = [
  Math.floor(TOTAL_ZOIC_TOKEN_AMOUNT * initRate),
  Math.floor((TOTAL_ZOIC_TOKEN_AMOUNT * initRate) / 2),
  Math.floor((TOTAL_ZOIC_TOKEN_AMOUNT * initRate) / 2 / 2),
  Math.floor((TOTAL_ZOIC_TOKEN_AMOUNT * initRate) / 2 / 2 / 2),
  Math.floor((TOTAL_ZOIC_TOKEN_AMOUNT * initRate) / 2 / 2 / 2 / 2),
  Math.floor((TOTAL_ZOIC_TOKEN_AMOUNT * initRate) / 2 / 2 / 2 / 2 / 2),
];
