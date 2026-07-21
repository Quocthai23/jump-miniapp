import { useClearinghouseStore } from "@/state/clearinghouseStore";
import { useMarketDataStore } from "@/state/market";
import { fromDisplayToSymbol } from "@/utils/displayCoin";
import { ArrowRightLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

export const PositionDetail = () => {
  const { assetPositions, currentPosition } = useClearinghouseStore();
  const { currentSymbolData, marketData } = useMarketDataStore();
  const [showTPSLEditor, setShowTPSLEditor] = useState(false);
  const [showPositionValue, setShowPositionValue] = useState(false);
  // Build real-time price and funding rate maps from marketData
  const markPriceByCoin = useMemo(() => {
    const map: Record<string, number> = {};
    (marketData || []).forEach((item: any) => {
      const nameKey = (item?.name || "").toUpperCase();
      const symbolKey = item?.symbol
        ? `${String(item.symbol).toUpperCase()}-PERP`
        : "";
      const price = Number(item?.price);
      if (!Number.isNaN(price)) {
        if (nameKey) map[nameKey] = price;
        if (symbolKey) map[symbolKey] = price;
      }
    });
    return map;
  }, [marketData]);

  const fundingRateByCoin = useMemo(() => {
    const map: Record<string, number> = {};
    (marketData || []).forEach((item: any) => {
      const nameKey = (item?.name || "").toUpperCase();
      const symbolKey = item?.symbol
        ? `${String(item.symbol).toUpperCase()}-PERP`
        : "";
      const fundingRate = Number(item?.funding);
      if (!Number.isNaN(fundingRate)) {
        if (nameKey) map[nameKey] = fundingRate;
        if (symbolKey) map[symbolKey] = fundingRate;
      }
    });
    return map;
  }, [marketData]);
  // Extract position data from assetPositions
  const position = useMemo(() => {
    if (!currentPosition) return null;

    const size = parseFloat(currentPosition.szi || "0");
    const entryPx = parseFloat(currentPosition.entryPx || "0");
    const marginUsed = parseFloat(currentPosition.marginUsed || "0");
    const positionValue = parseFloat(currentPosition.positionValue || "0");
    const liquidationPrice = parseFloat(currentPosition.liquidationPx || 0);
    const leverage = currentPosition.leverage?.value || 1;

    // Get mark price (realtime from marketData, fallback to API value)
    const coinKey = (currentPosition.coin || "").toUpperCase();
    const markPx = markPriceByCoin[coinKey] || entryPx;

    // Get funding rate from marketData
    const fundingRate = fundingRateByCoin[coinKey] || 0;

    // Use API values directly when available, fallback to calculations
    const funding =
     size * currentSymbolData?.price * fundingRate;
     console.log('Funding calculation:', funding);
    const unrealizedPnl =
      parseFloat(currentPosition.unrealizedPnl || "0") ||
      (markPx - entryPx) * size;
    const roe =
      currentPosition.returnOnEquity !== undefined
        ? currentPosition.returnOnEquity * 100
        : (() => {
            const absSize = Math.abs(size);
            const initialMargin =
              entryPx > 0 && leverage > 0 ? (entryPx * absSize) / leverage : 0;
            return initialMargin > 0
              ? (unrealizedPnl / initialMargin) * 100
              : 0;
          })();

    return {
      coin: currentPosition.coin,
      size,
      entryPx: entryPx.toFixed(2),
      unrealizedPnl: unrealizedPnl.toFixed(2),
      leverage: currentPosition.leverage
        ? {
            value: currentPosition.leverage.value,
            type: currentPosition.leverage.type,
          }
        : undefined,
      funding,
      marginUsed: marginUsed.toFixed(2),
      roe,
      liquidationPrice,
      positionValue,
    };
  }, [assetPositions, currentPosition, markPriceByCoin, fundingRateByCoin]);

  const isLong = useMemo(() => {
    if (!position) return true;
    return position.liquidationPrice < parseFloat(position.entryPx);
  }, [position]);

  const liquidationChangePercent = useMemo(() => {
    if (!position) return 0;
    const entryPx = parseFloat(position.entryPx);
    const liquidationPx = position.liquidationPrice;
    if (entryPx === 0) return 0;
    return ((liquidationPx - entryPx) / entryPx) * 100;
  }, [position]);

  if (!position) {
    return null;
  }

  const displayCoin = fromDisplayToSymbol(position.coin);
  const unrealizedPnL = parseFloat(position.unrealizedPnl);
  const pnlColor = unrealizedPnL < 0 ? "text-red-500" : "text-green-500";
  const roeColor = position.roe < 0 ? "text-red-500" : "text-green-500";
  const liquidationColor =
    liquidationChangePercent < 0 ? "text-red-500" : "text-green-500";
  const fundingColor = position.funding < 0 ? "text-red-500" : "text-green-500";

  return (
    <div className=" surface-page-background text-primary-primary">
      <div className="space-y-6 w-full">
        <div className="mt-6">
          <h3 className="body-subtitle-semibold text-primary-primary mb-4">
            Position
          </h3>
          <div className="flex items-center w-full gap-3 mb-3">
            <div className="flex items-center justify-between p-4 rounded-[12px] w-full shadow-200">
              <span className="body-body-regular text-primary-secondary">
                P&L
              </span>
              <p className={`body-subtitle-semibold ${pnlColor}`}>
                {unrealizedPnL > 0 ? "+" : ""}$
                {Math.abs(unrealizedPnL).toFixed(2)}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-[12px] w-full shadow-200">
              <span className="body-body-regular text-primary-secondary">
                Return
              </span>
              <p className={`body-subtitle-semibold ${pnlColor}`}>
                {unrealizedPnL > 0 ? "+" : ""}$
                {Math.abs(unrealizedPnL).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="surface-page-background rounded-[12px] p-4 w-full shadow-200">
              <div className="text-primary-secondary flex justify-between items-center ">
                <p className=" body-body-regular mb-1">Size</p>
                <ArrowRightLeft
                  size={18}
                  onClick={() => setShowPositionValue(!showPositionValue)}
                />
              </div>
              <p className="body-body-semibold text-primary-primary">
                {showPositionValue
                  ? `$${(Math.abs(position.size) * (currentSymbolData?.price || 0)).toFixed(2)}`
                  : `${Math.abs(position.size).toFixed(currentSymbolData?.szDecimals)} ${displayCoin}`}
              </p>
            </div>

            <div className="surface-page-background rounded-[12px] p-4 w-full shadow-200">
              <div className="flex text-primary-secondary justify-between items-center ">
                <p className=" body-body-regular mb-1">Margin</p>
                <ChevronRight size={20} />
              </div>

              <p className="body-body-semibold text-primary-primary">
                ${parseFloat(position.marginUsed).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="">
          <h3 className="body-subtitle-semibold text-primary-primary mb-3">
            Details
          </h3>
          <div className=" p-4 surface-page-background rounded-[12px] shadow-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border-secondary ">
                <span className="body-body-regular text-primary-secondary">
                  Direction
                </span>
                <span className="text-primary-primary body-body-semibold">
                  {isLong ? "Long" : "Short"} {position.leverage?.value}x
                </span>
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-border-secondary ">
                <div className="flex items-center gap-2">
                  <span className="body-body-regular text-primary-secondary">
                    Entry price
                  </span>
                </div>
                <span className="body-body-semibold text-primary-primary">
                  $
                  {parseFloat(position.entryPx).toLocaleString("en-US", {
                    minimumFractionDigits: currentSymbolData?.decimals,
                    maximumFractionDigits: currentSymbolData?.decimals,
                  })}
                </span>
              </div>

              {/* Funding Rate */}
              <div className="flex items-center justify-between border-b  pb-4 border-border-secondary">
                <div className="flex items-center gap-2">
                  <span className="body-body-regular text-primary-secondary">
                    Liquidation price
                  </span>
                </div>
                <span className="body-body-semibold text-primary-primary">
                  $
                  {position.liquidationPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="body-body-regular text-primary-secondary">
                    Funding payments
                  </span>
                </div>
                <span className="body-body-semibold text-primary-primary">
                  {position.funding < 0 ? "-" : "+"}${position.funding}
                </span>
              </div>
            </div>

            {/* Info Modal */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PositionDetail;
