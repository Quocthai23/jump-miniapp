/**
 * TradingView Chart Widget Type Definitions
 * Unified interface for all chart-related types used across hooks
 */

/**
 * Chart widget instance type - represents the TradingView widget object
 */
export interface ChartWidget {
  /**
   * Remove the widget from DOM
   */
  remove(): void;

  /**
   * Register callback when chart is ready for interaction
   */
  onChartReady(callback: () => void): void;

  /**
   * Get the chart instance
   */
  chart(): unknown;

  /**
   * Get the currently active chart
   * Returns object with resolution method or null if not available
   */
  activeChart(): ActiveChart | null;

  /**
   * Set the symbol for the chart
   * @param symbol - Symbol to display (e.g., "BTC-PERP")
   * @param resolution - Chart resolution (e.g., "60" for 1 hour)
   * @param callback - Optional callback when symbol is set
   */
  setSymbol(symbol: string, resolution: string, callback?: () => void): void;
}

/**
 * Active chart instance - returned by widget.activeChart()
 */
export interface ActiveChart {
  /**
   * Get the current resolution of the chart
   */
  resolution(): string;

  /**
   * Refresh the marks (trade history indicators) on the chart
   */
  refreshMarks?(): void;
  /**
   * Set the symbol for the chart
   * @param symbol - Symbol to display (e.g., "BTC-PERP")
   * @param resolution - Chart resolution (e.g., "60" for 1 hour)
   * @param callback - Optional callback when symbol is set
   */
  setSymbol(symbol: string, resolution: string, callback?: () => void): void;
}
