import { useTradeHistoryStore } from "@/state/trading/tradeHistoryStore";
import { useMemo } from "react";

/**
 * Custom hook that provides easy access to trade history data from the Zustand store
 * This hook can be used in any component that needs access to trading history data
 */
export function useTradeHistory() {
  const store = useTradeHistoryStore();

  // Memoized filtered data to prevent unnecessary re-renders
  const filteredData = useMemo(
    () => ({
      tradeHistory: store.getFilteredTradeHistory(),
      fundingHistory: store.getFilteredFundingHistory(),
      orderHistory: store.getFilteredOrderHistory(),
      twapFills: store.getFilteredTwapFills(),
    }),
    [
      store.getFilteredTradeHistory,
      store.getFilteredFundingHistory,
      store.getFilteredOrderHistory,
      store.getFilteredTwapFills,
    ],
  );

  // Loading states
  const isLoading = useMemo(
    () => ({
      tradeHistory: store.isLoadingTradeHistory,
      fundingHistory: store.isLoadingFundingHistory,
      orderHistory: store.isLoadingOrderHistory,
      twap: store.isLoadingTwap,
    }),
    [
      store.isLoadingTradeHistory,
      store.isLoadingFundingHistory,
      store.isLoadingOrderHistory,
      store.isLoadingTwap,
    ],
  );

  // Error states
  const errors = useMemo(
    () => ({
      tradeHistory: store.tradeHistoryError,
      fundingHistory: store.fundingHistoryError,
      orderHistory: store.orderHistoryError,
      twap: store.twapError,
    }),
    [
      store.tradeHistoryError,
      store.fundingHistoryError,
      store.orderHistoryError,
      store.twapError,
    ],
  );

  // Actions
  const actions = useMemo(
    () => ({
      setSelectedCoin: store.setSelectedCoin,
      setMaxResults: store.setMaxResults,
      clearAllData: store.clearAllData,
      clearErrors: store.clearErrors,
      resetToDefaults: store.resetToDefaults,
      updateTimeRange: store.updateTimeRange,
    }),
    [
      store.setSelectedCoin,
      store.setMaxResults,
      store.clearAllData,
      store.clearErrors,
      store.resetToDefaults,
      store.updateTimeRange,
    ],
  );

  return {
    // Filtered data
    ...filteredData,

    // Raw data (unfiltered)
    rawData: {
      tradeHistory: store.tradeHistory,
      fundingHistory: store.fundingHistory,
      orderHistory: store.orderHistory,
      twapFills: store.twapFills,
    },

    // Loading states
    isLoading,

    // Error states
    errors,

    // Actions
    actions,

    // Current filter state
    selectedCoin: store.selectedCoin,
    timeRange: store.timeRange,
    maxResults: store.maxResults,
  };
}

/**
 * Hook that provides summary statistics from trade history
 */
export function useTradeHistoryStats() {
  const { tradeHistory, fundingHistory } = useTradeHistory();

  return useMemo(() => {
    const totalTrades = tradeHistory.length;

    const totalPnl = tradeHistory.reduce((acc, trade) => {
      const pnl =
        typeof trade.closedPnl === "string"
          ? parseFloat(trade.closedPnl)
          : trade.closedPnl || 0;
      return acc + pnl;
    }, 0);

    const totalFunding = fundingHistory.reduce((acc, funding) => {
      const amount =
        typeof funding.funding === "string"
          ? parseFloat(funding.funding)
          : funding.funding || 0;
      return acc + amount;
    }, 0);

    const winningTrades = tradeHistory.filter((trade) => {
      const pnl =
        typeof trade.closedPnl === "string"
          ? parseFloat(trade.closedPnl)
          : trade.closedPnl || 0;
      return pnl > 0;
    }).length;

    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    return {
      totalTrades,
      totalPnl,
      totalFunding,
      winningTrades,
      losingTrades: totalTrades - winningTrades,
      winRate,
    };
  }, [tradeHistory, fundingHistory]);
}
