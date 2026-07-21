/**
 * Hyperliquid Liquidation Price Calculator
 * Based on: https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations
 */

/**
 * Calculate maintenance leverage from max leverage
 * Based on Hyperliquid docs: "The maintenance margin is half of the initial margin at max leverage"
 *
 * Initial margin at max leverage = 1 / maxLeverage
 * Maintenance margin = (1 / maxLeverage) / 2 = 1 / (maxLeverage * 2)
 * Therefore: maintenanceLeverage = maxLeverage * 2
 *
 * @param {number} maxLeverage - Maximum leverage for the asset
 * @returns {number} Maintenance leverage
 */
const calculateMaintenanceLeverage = (maxLeverage: number): number => {
  return maxLeverage * 2;
};

/**
 * Calculate liquidation price for a position
 *
 * Core rule (Hyperliquid): liquidate when Equity <= Maintenance Margin.
 *
 * Approx (for a single position, funding ~ 0 at open):
 * Equity = Margin + PnL
 * Maintenance Margin = Notional / maintenanceLeverage
 *
 * We solve for liqPrice where:
 *   Margin + PnL(liqPrice) = (positionSize * liqPrice) / maintenanceLeverage
 *
 * NOTE: `price` is treated as the *entry price* for this calculation.
 *
 * @param {Object} params - Position parameters
 * @param {number} params.price - Entry price
 * @param {number} params.positionSize - Position size in base asset (e.g., BTC amount)
 * @param {number} params.leverage - Leverage used
 * @param {string} params.side - 'long' or 'short'
 * @param {string} params.marginType - 'isolated' or 'cross'
 * @param {number} params.accountValue - Total account value (for cross margin)
 * @param {number} params.maxLeverage - Maximum leverage for the asset
 * @returns {number} Liquidation price
 */
const calculateLiquidation = (params: LiquidationParams): number => {
  const {
    price,
    positionSize,
    leverage,
    side,
    marginType,
    accountValue = 0,
    maxLeverage,
  } = params;

  if (
    !Number.isFinite(price) ||
    !Number.isFinite(positionSize) ||
    positionSize <= 0
  ) {
    return 0;
  }
  if (!Number.isFinite(maxLeverage) || maxLeverage <= 0) {
    return 0;
  }
  if (!Number.isFinite(leverage) || leverage <= 0) {
    return 0;
  }

  // Get asset configuration
  const maintenanceLeverage = calculateMaintenanceLeverage(maxLeverage);
  const invMaintLev = 1 / maintenanceLeverage;

  // Treat `price` as entry price
  const entryPrice = price;

  // Margin used in the equity equation:
  // - isolated: initial margin for the position (notional / leverage)
  // - cross: account equity backing the position (accountValue)
  const notionalAtEntry = positionSize * entryPrice;
  const isolatedInitialMargin = notionalAtEntry / leverage;
  const margin = marginType === "cross" ? accountValue : isolatedInitialMargin;

  // Solve:
  // long:  margin + (liq - entry)*size = size*liq/maintLev
  // short: margin + (entry - liq)*size = size*liq/maintLev
  const isLong = side.toLowerCase() === "long";

  const denom = positionSize * (isLong ? 1 - invMaintLev : 1 + invMaintLev);
  if (!Number.isFinite(denom) || denom === 0) return 0;

  const numerator = isLong
    ? notionalAtEntry - margin
    : margin + notionalAtEntry;

  const liquidationPrice = numerator / denom;
  return Number.isFinite(liquidationPrice) ? Math.max(0, liquidationPrice) : 0;
};

// Type definitions
interface LiquidationParams {
  price: number;
  positionSize: number;
  leverage: number;
  side: "long" | "short";
  marginType: "isolated" | "cross";
  accountValue?: number;
  maxLeverage: number;
}

// Exports
export { calculateMaintenanceLeverage, calculateLiquidation };
export type { LiquidationParams };
