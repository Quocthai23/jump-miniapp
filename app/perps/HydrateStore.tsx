import { useEffect } from "react";
import {
  useMarketDataStore,
  type MarketData,
} from "state/market/marketDataStore";
import { useTradingContextStore } from "state/trading/tradingContextStore";

export function HydrateMarketData({
  symbol,
  marketData,
}: {
  symbol: string;
  marketData: MarketData[];
}) {
  useEffect(() => {
    if (!marketData || marketData.length === 0) return;

    const realSymbol = symbol.toLowerCase().includes("perp")
      ? symbol
      : `${symbol}-PERP`;

    const symbolData = marketData.find(
      (data) => data.name === realSymbol.toUpperCase(),
    );

    useMarketDataStore.setState({
      isLoading: false,
      marketData,
      currentSymbolData: symbolData || null,
      isHydrated: true,
    });

    useTradingContextStore.setState((state) => ({
      ...state,
      selectedCoin: realSymbol.toUpperCase(),
    }));
  }, [symbol, marketData]);

  return null;
}
