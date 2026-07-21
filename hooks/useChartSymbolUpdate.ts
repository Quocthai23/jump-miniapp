/**
 * useChartSymbolUpdate - Manages chart symbol updates
 */

import { useEffect } from "react";
import { useChartDataStore } from "@/state/chart/chartDataStore";
import type { ChartWidget } from "../types/tradingview";

interface UseChartSymbolUpdateProps {
  widgetRef: React.MutableRefObject<ChartWidget | null>;
  tvSymbol: string;
  isChartReady: boolean;
}

export function useChartSymbolUpdate({
  widgetRef,
  tvSymbol,
  isChartReady,
}: UseChartSymbolUpdateProps) {
  const { clearLatestCandle } = useChartDataStore();

  useEffect(() => {
    if (tvSymbol && widgetRef.current && isChartReady) {
      try {
        const widget = widgetRef.current;

        if (!widget) {
          console.warn("Widget not available");
          return;
        }

        // Clear latest candle when switching symbols
        // clearLatestCandle();

        // Try to get current resolution from active chart
        let currentResolution = "60"; // Default to 1 hour

        try {
          const activeChart = widget.activeChart();
          if (activeChart && typeof activeChart.resolution === "function") {
            currentResolution = activeChart.resolution();
          }
        } catch (chartError) {
          console.warn("Could not get current resolution:", chartError);
        }

        // Call setSymbol on the widget (not on activeChart)
        if (
          widget &&
          widget?.setSymbol &&
          typeof widget.setSymbol === "function"
        ) {
          widget.setSymbol(tvSymbol, currentResolution, () => {});
        } else {
          console.warn("setSymbol method not available on widget");
        }
      } catch (error) {
        // console.error("Error updating symbol:", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tvSymbol, isChartReady]);
}
