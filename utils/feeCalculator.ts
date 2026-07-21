export interface PerpFeeArgs {
  deployerFeeScale?: number;
  growthMode?: boolean;
}

export interface FeeRatesResult {
  makerPercentage: number;
  takerPercentage: number;
}

export function calculatePerpFee(
  fees: { makerRate: number; takerRate: number },
  activeReferralDiscount: number,
  isAlignedQuoteToken: boolean = true,
  args: PerpFeeArgs = {},
): FeeRatesResult {
  const { deployerFeeScale = 0, growthMode = false } = args;

  const scaleIfHip3 =
    deployerFeeScale < 1 ? deployerFeeScale + 1 : deployerFeeScale * 2;

  const deployerShare =
    deployerFeeScale < 1 ? deployerFeeScale / (1 + deployerFeeScale) : 0.5;

  const growthModeScale = growthMode ? 0.1 : 1;

  let makerPercentage = fees.makerRate * 100 * growthModeScale;
  if (makerPercentage > 0) {
    makerPercentage *= scaleIfHip3 * (1 - activeReferralDiscount);
  } else {
    const makerRebateScale = isAlignedQuoteToken
      ? (1 - deployerShare) * 1.5 + deployerShare
      : 1;
    makerPercentage *= makerRebateScale;
  }

  let takerPercentage =
    fees.takerRate *
    100 *
    scaleIfHip3 *
    growthModeScale *
    (1 - activeReferralDiscount);

  if (isAlignedQuoteToken) {
    const takerScale = (1 - deployerShare) * 0.8 + deployerShare;
    takerPercentage *= takerScale;
  }

  return { makerPercentage, takerPercentage };
}
