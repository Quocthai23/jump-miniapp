/**
 * useChartTradeHistoryUpdate - Manages trade history updates and mark refreshing
 */

import { useEffect } from "react";
import { HyperliquidDatafeed } from "@/utils/tradingview/hyperliquidDatafeed";
import type { ChartWidget } from "../types/tradingview";

interface UseChartTradeHistoryUpdateProps {
  datafeedRef: React.MutableRefObject<HyperliquidDatafeed | null>;
  widgetRef: React.MutableRefObject<ChartWidget | null>;
  tradeHistory: unknown[];
  isChartReady: boolean;
}

export function useChartTradeHistoryUpdate({
  datafeedRef,
  widgetRef,
  tradeHistory,
  isChartReady,
}: UseChartTradeHistoryUpdateProps) {
  useEffect(() => {
    if (datafeedRef.current && tradeHistory) {
      // Update trade history in datafeed
      datafeedRef.current.updateTradeHistory((tradeHistory as never[]) || []);

      // Refresh marks if chart is ready
      if (widgetRef.current && isChartReady) {
        try {
          const widget = widgetRef.current;
          const activeChart = widget.activeChart();

          if (activeChart && typeof activeChart.refreshMarks === "function") {
            activeChart.refreshMarks();
          }
        } catch (error) {
          console.warn("Could not refresh marks:", error);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeHistory, isChartReady]);
}
