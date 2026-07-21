/**
 * useChartInitialization - Manages chart widget creation and lifecycle
 */

import { useChartDataStore } from "@/state/chart/chartDataStore";
import { useEffect, useRef } from "react";
import type { ChartWidget } from "types/tradingview";
import { HyperliquidDatafeed } from "utils/tradingview/hyperliquidDatafeed";

interface UseChartInitializationProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  tvSymbol: string;
  readOnlySdk: unknown;
  tradeHistory: unknown[];
  isLibraryLoaded: boolean;
  onReady?: () => void;
  onError?: (error: string) => void;
}

export function useChartInitialization({
  containerRef,
  tvSymbol,
  readOnlySdk,
  tradeHistory,
  isLibraryLoaded,
  onReady,
  onError,
}: UseChartInitializationProps) {
  const widgetRef = useRef<ChartWidget | null>(null);
  const datafeedRef = useRef<HyperliquidDatafeed | null>(null);
  const sdkRef = useRef(readOnlySdk);
  const historyRef = useRef(tradeHistory);
  const symbolRef = useRef(tvSymbol);
  const initializedRef = useRef(false);
  const { clearLatestCandle } = useChartDataStore();

  // Update refs without triggering re-initialization
  sdkRef.current = readOnlySdk;
  historyRef.current = tradeHistory;
  symbolRef.current = tvSymbol;

  // Initialize chart only once when library loads
  useEffect(() => {
    if (!isLibraryLoaded || !containerRef.current || initializedRef.current) {
      return;
    }
    initializedRef.current = true;

    try {
      // TradingView.widget is a class constructor that requires 'new'
      const TradingViewWidget = window.TradingView?.widget;
      clearLatestCandle();
      if (!TradingViewWidget) {
        const errorMessage =
          "TradingView widget not available. Library may not be loaded properly.";
        onError?.(errorMessage);
        throw new Error(errorMessage);
      }

      // Create datafeed with proper typing
      const datafeed = new HyperliquidDatafeed(
        (sdkRef.current as never) || null,
        (historyRef.current as never[]) || [],
      );
      datafeedRef.current = datafeed;

      // Configure widget options
      const widgetOptions = {
        symbol: tvSymbol, // Initial symbol only (from ref)
        datafeed,
        interval: "60",
        container: containerRef.current,
        library_path: "/tradingview/",
        locale: "en",
        disabled_features: [
          "use_localstorage_for_settings",
          "study_templates",
          "header_compare",
          "header_symbol_search",
          "header_screenshot",
          "header_saveload",
          "header_undo_redo",
          "header_settings",
          "volume_force_overlay",
          "create_volume_indicator_by_default",
          "save_chart_properties_to_local_storage",
          "chart_property_page_trading",
          "chart_crosshair_menu",
          "popup_hints",
          "left_toolbar",
          "header_toolbar",
          "header",
          "go_to_date",
          "timeframes_toolbar",
          "header_symbol_search",
          "header_compare",
          "header_indicators",
          "header_settings",
          "header_screenshot",
          "header_saveload",
          "header_undo_redo",
          "header_fullscreen",
          "header_widget",
          "header",
          "legend_widget",
          "symbol_info",
        ],
        enabled_features: [],
        fullscreen: false,
        autosize: true,
        theme: "Light",
        loading_screen: {
          backgroundColor: "#FFFFFF",
          foregroundColor: "#888888",
        },
        save_load_adapter: null,
        charts_storage_url: undefined,
        charts_storage_api_version: undefined,
        client_id: undefined,
        user_id: undefined,
      };

      // Create the widget using the class constructor with 'new'
      const tvWidget = new TradingViewWidget(
        widgetOptions as unknown,
      ) as ChartWidget;
      widgetRef.current = tvWidget;

      // Only mark chart as "ready" after TradingView fires onChartReady,
      // ensuring the internal API (_innerAPI / changeSymbol) is available
      tvWidget.onChartReady(() => {
        try {
          const currentChart = tvWidget.chart();

          if (typeof window !== "undefined") {
            (window as unknown as Record<string, unknown>).chart = currentChart;
          }

          onReady?.();
        } catch (err) {
          console.error("Error in chart ready callback:", err);
        }
      });
    } catch (err) {
      initializedRef.current = false;
      const errorMessage =
        err instanceof Error ? err.message : "Failed to initialize chart";
      onError?.(errorMessage);
      console.error("Error initializing TradingView chart:", err);
    }

    return () => {
      // Cleanup datafeed subscriptions first
      // if (datafeedRef.current) {
      //   datafeedRef.current.cleanup();
      //   datafeedRef.current = null;
      // }
      // Cleanup widget
      // if (widgetRef.current) {
      //   try {
      //     widgetRef.current.remove();
      //   } catch (err) {
      //     console.error("Error removing TradingView widget:", err);
      //   }
      //   widgetRef.current = null;
      // }
    };
  }, [isLibraryLoaded, containerRef, onReady, onError]);

  return {
    widgetRef,
    datafeedRef,
  };
}
