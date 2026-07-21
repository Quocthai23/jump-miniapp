import { useHyperliquid } from "@/contexts/HyperliquidContext";
import { useChart } from "@/contexts/ChartContext";
import { useHydratedTradingStore } from "@/hooks/useHydratedTradingStore";
import { useTradeHistoryStore } from "@/state/trading";
import { useState, useRef, useCallback, useMemo, memo, useEffect } from "react";
import { useChartLibrary } from "@/hooks/useChartLibrary";
import { useChartInitialization } from "@/hooks/useChartInitialization";
import { useChartSymbolUpdate } from "@/hooks/useChartSymbolUpdate";
import { useChartTradeHistoryUpdate } from "@/hooks/useChartTradeHistoryUpdate";

/**
 * TradingViewChart - Refactored chart component with separated concerns
 * Handles:
 * - Library loading (useChartLibrary)
 * - Chart initialization (useChartInitialization)
 * - Symbol updates (useChartSymbolUpdate)
 * - Trade history updates (useChartTradeHistoryUpdate)
 */
function TradingViewChartComponent() {
  const { selectedCoin: coin } = useHydratedTradingStore();
  const { readOnlySdk } = useHyperliquid();
  const { tradeHistory } = useTradeHistoryStore();
  const chartContext = useChart();
  // State management
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [isChartReady, setIsChartReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prepare coin symbol for TradingView - memoize to prevent recalculation
  const tvSymbol = useMemo(() => {
    return coin?.replaceAll("-USDC", "-PERP");
  }, [coin]);

  // Memoized callbacks to prevent unnecessary re-initializations
  const handleChartReady = useCallback(() => {
    setIsChartReady(true);
    setError(null);
    chartContext.setChartReady(true);
  }, [chartContext]);

  const handleChartError = useCallback((errorMsg: string) => {
    setError(errorMsg);
  }, []);

  // 1. Load TradingView library
  const { isLibraryLoaded, libraryError } = useChartLibrary();

  // Update error state when library fails to load
  if (libraryError && !error) {
    setError(libraryError);
  }

  // 2. Initialize chart widget
  const { widgetRef, datafeedRef } = useChartInitialization({
    containerRef: chartContainerRef,
    tvSymbol,
    readOnlySdk: readOnlySdk || null,
    tradeHistory: tradeHistory || [],
    isLibraryLoaded,
    onReady: handleChartReady,
    onError: handleChartError,
  });

  // Sync widgetRef with chart context
  useEffect(() => {
    if (widgetRef.current) {
      chartContext.widgetRef.current = widgetRef.current;
    }
  }, [widgetRef, chartContext]);

  useChartSymbolUpdate({
    widgetRef,
    tvSymbol,
    isChartReady,
  });

  // 4. Handle trade history updates
  useChartTradeHistoryUpdate({
    datafeedRef,
    widgetRef,
    tradeHistory: tradeHistory || [],
    isChartReady,
  });

  // Error state UI
  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0C130F]">
        <div className="text-center">
          <p className="mb-2 text-red-500">Error loading TradingView chart</p>
          <p className="text-sm text-gray-400">{error}</p>
          <button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="relative h-full min-h-70 w-full bg-gray-300">
      <div
        ref={chartContainerRef}
        id="tradingview_chart_container"
        className="h-full w-full"
        style={{ minHeight: "250px" }}
      />
      {/* Loading overlay while chart initializes */}
      {(!isChartReady || !isLibraryLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
          <div className="text-gray-400">{/* {!isLibraryLoaded && } */}</div>
        </div>
      )}
    </div>
  );
}

// Wrap with memo to prevent re-renders when parent re-renders
// Component will only re-render if selectedCoin or readOnlySdk changes
export const TradingViewChart = memo(TradingViewChartComponent);
