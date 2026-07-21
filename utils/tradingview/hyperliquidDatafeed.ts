/**
 * HyperliquidDatafeed - TradingView Datafeed Implementation
 * Handles real-time candle data, bars, and trade marks from Hyperliquid
 */

import { getCurrentSymbolData } from "@/state/market/marketDataStore";
import { useChartDataStore } from "@/state/chart/chartDataStore";

interface TradeHistoryRecord {
  coin: string;
  side: string;
  px: string | number;
  time: number;
  hash?: string;
  tid?: string;
}

interface HyperliquidCandleData {
  t: number; // Start time (timestamp in milliseconds)
  T: number; // End time (timestamp in milliseconds)
  s: string; // Symbol (e.g., "BTC-PERP")
  i: string; // Interval (e.g., "4h", "1h", "1m")
  o: number; // Open price
  c: number; // Close price
  h: number; // High price
  l: number; // Low price
  v: number; // Volume
  n: number; // Number of trades
}

interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface HistoryMetadata {
  noData: boolean;
}

interface SymbolInfo {
  name: string;
  full_name: string;
  description: string;
  type: string;
  session: string;
  timezone: string;
  ticker: string;
  exchange: string;
  minmov: number;
  pricescale: number;
  has_intraday: boolean;
  supported_resolutions: string[];
  volume_precision: number;
  data_status: string;
  has_weekly_and_monthly: boolean;
}

interface Mark {
  id: string;
  time: number;
  color: string;
  text: string[];
  label: string;
  labelFontColor: string;
  minSize: number;
}

interface ReaderConfig {
  supported_resolutions: string[];
  supports_marks: boolean;
  supports_time: boolean;
  supports_timescale_marks: boolean;
}

interface PeriodParams {
  from: number;
  to: number;
  firstDataRequest: boolean;
}

interface Hyperliquid {
  info: {
    getCandleSnapshot(
      symbol: string,
      interval: string,
      startTime: number,
      endTime: number,
    ): Promise<HyperliquidCandleData[]>;
  };
  subscriptions: {
    subscribeToCandle(
      coin: string,
      interval: string,
      callback: (data: HyperliquidCandleData) => void,
    ): Promise<void>;
    unsubscribeFromCandle(coin: string, interval: string): Promise<void>;
  };
}

export class HyperliquidDatafeed {
  private readOnlySdk: Hyperliquid | null;
  private currentSubscriptions: Map<string, () => void> = new Map();
  private candleCache: Map<string, HyperliquidCandleData[]> = new Map();
  private tradeHistory: TradeHistoryRecord[] = [];

  constructor(
    readOnlySdk: Hyperliquid | null,
    tradeHistory: TradeHistoryRecord[] = [],
  ) {
    this.readOnlySdk = readOnlySdk;
    this.tradeHistory = tradeHistory;
  }

  /**
   * Update trade history for marks display
   */
  public updateTradeHistory(tradeHistory: TradeHistoryRecord[]) {
    this.tradeHistory = tradeHistory;
  }

  /**
   * Initialize datafeed - called once when chart is created
   */
  public onReady(callback: (config: ReaderConfig) => void) {
    setTimeout(() => {
      callback({
        supported_resolutions: ["1", "5", "15", "30", "60", "240", "1D"],
        supports_marks: true,
        supports_time: true,
        supports_timescale_marks: false,
      });
    }, 0);
  }

  /**
   * Get trade marks to display on chart
   */
  public getMarks(
    symbolInfo: SymbolInfo,
    _from: number,
    _to: number,
    onDataCallback: (marks: Mark[]) => void,
  ) {
    const marks: Mark[] = [];

    if (!this.tradeHistory || !Array.isArray(this.tradeHistory)) {
      onDataCallback(marks);
      return;
    }

    const baseSymbol = this.extractBaseSymbol(symbolInfo.name);
    const filteredTrades = this.tradeHistory.filter((trade) => {
      const tradeCoin = trade.coin.replace("-PERP", "");
      return tradeCoin === baseSymbol;
    });

    filteredTrades.forEach((trade, index) => {
      const isLong = trade.side === "B" || trade.side === "buy";
      const tradeTime = Math.floor(trade.time / 1000);

      marks.push({
        id: `trade_${trade.hash || trade.tid || index}`,
        time: tradeTime,
        color: isLong ? "green" : "red",
        text: [
          `Open ${isLong ? "Long" : "Short"} ${trade.coin} at $${parseFloat(trade.px.toString()).toFixed(1)}`,
        ],
        label: isLong ? "B" : "S",
        labelFontColor: "white",
        minSize: 20,
      });
    });

    onDataCallback(marks);
  }

  /**
   * Search for symbols (not implemented)
   */
  public searchSymbols(
    _userInput: string,
    _exchange: string,
    _symbolType: string,
    onResultReadyCallback: (results: SymbolInfo[]) => void,
  ) {
    setTimeout(() => {
      onResultReadyCallback([]);
    }, 0);
  }

  /**
   * Resolve symbol info
   */
  public resolveSymbol(
    symbolName: string,
    onSymbolResolvedCallback: (symbolInfo: SymbolInfo) => void,
  ) {
    const currentSymbolData = getCurrentSymbolData();

    const symbolInfo: SymbolInfo = {
      name: symbolName,
      full_name: symbolName,
      description: symbolName,
      type: "crypto",
      session: "24x7",
      timezone: "Etc/UTC",
      ticker: symbolName,
      exchange: "JUMP",
      minmov: 1,
      pricescale: Math.pow(10, currentSymbolData?.decimals || 0),
      has_intraday: true,
      supported_resolutions: ["1", "5", "15", "30", "60", "240", "1D"],
      volume_precision: 2,
      data_status: "streaming",
      has_weekly_and_monthly: false,
    };

    setTimeout(() => {
      onSymbolResolvedCallback(symbolInfo);
    }, 0);
  }

  /**
   * Fetch historical bars
   */
  public async getBars(
    symbolInfo: SymbolInfo,
    resolution: string,
    periodParams: PeriodParams,
    onHistoryCallback: (bars: Bar[], metadata: HistoryMetadata) => void,
    onErrorCallback: (error: string) => void,
  ) {
    const { from, to, firstDataRequest } = periodParams;

    if (!this.readOnlySdk) {
      onHistoryCallback([], { noData: true });
      return;
    }

    const interval = this.convertResolutionToInterval(resolution);
    const symbol = this.extractBaseSymbol(symbolInfo.name);
    const startTime = from * 1000;
    const endTime = to * 1000;

    await this.readOnlySdk.info
      .getCandleSnapshot(symbol, interval, startTime, endTime)
      .then((candles: HyperliquidCandleData[]) => {
        if (!candles || !Array.isArray(candles) || candles.length === 0) {
          onHistoryCallback([], { noData: true });
          return;
        }

        const cacheKey = `${symbol}_${interval}_${startTime}_${endTime}`;
        this.candleCache.set(cacheKey, candles);

        const bars = candles.map((candle: HyperliquidCandleData) => ({
          time: Math.floor(candle.t / 1000) * 1000,
          low: parseFloat(candle.l.toString()),
          high: parseFloat(candle.h.toString()),
          open: parseFloat(candle.o.toString()),
          close: parseFloat(candle.c.toString()),
          volume: parseFloat((candle.v || 0).toString()),
        }));

        bars.sort((a: Bar, b: Bar) => a.time - b.time);

        const latestBar = bars[bars.length - 1];

        if (firstDataRequest && latestBar)
          useChartDataStore.setState({ latestCandle: latestBar });
        onHistoryCallback(bars, { noData: false });
      })
      .catch((error: Error) => {
        console.error("Error fetching candles:", error);
        onErrorCallback(error.message || "Failed to fetch data");
      });
  }

  /**
   * Subscribe to real-time bars
   */
  public subscribeBars(
    symbolInfo: SymbolInfo,
    resolution: string,
    onRealtimeCallback: (bar: Bar) => void,
    subscriberUID: string,
  ) {
    if (!this.readOnlySdk || !this.readOnlySdk.subscriptions) {
      console.warn("Hyperliquid SDK or subscriptions not available");
      return;
    }

    try {
      const coin = this.extractBaseSymbol(symbolInfo.name);
      const coinSymbol = `${coin}-PERP`;
      const interval = this.convertResolutionToInterval(resolution);

      // Clean up existing subscription
      const existingUnsubscribe = this.currentSubscriptions.get(subscriberUID);
      if (existingUnsubscribe) {
        existingUnsubscribe();
        this.currentSubscriptions.delete(subscriberUID);
      }

      // Subscribe to real-time candles
      this.readOnlySdk.subscriptions
        .subscribeToCandle(
          coinSymbol,
          interval,
          (candleData: HyperliquidCandleData) => {
            const bar = this.convertHyperliquidCandleToBar(candleData);
            if (bar) {
              // Update the latest candle in store for use in PairInfoBar
              useChartDataStore.setState({ latestCandle: bar });
              onRealtimeCallback(bar);
            }
          },
        )
        .then(() => {
          const unsubscribe = async () => {
            try {
              await this.readOnlySdk!.subscriptions.unsubscribeFromCandle(
                coinSymbol,
                interval,
              );
            } catch (error) {
              console.error("Error unsubscribing from candle:", error);
            }
          };

          this.currentSubscriptions.set(subscriberUID, unsubscribe);
        })
        .catch((error: Error) => {
          console.error("Error subscribing to real-time candles:", error);
        });
    } catch (error) {
      console.error("Error in subscribeBars:", error);
    }
  }

  /**
   * Unsubscribe from real-time bars
   */
  public unsubscribeBars(subscriberUID: string) {
    const unsubscribe = this.currentSubscriptions.get(subscriberUID);
    if (unsubscribe) {
      unsubscribe();
      this.currentSubscriptions.delete(subscriberUID);
    }
  }

  /**
   * Get cached candle data
   */
  public getCachedCandles(
    symbol: string,
    interval: string,
    startTime: number,
    endTime: number,
  ): HyperliquidCandleData[] | null {
    const cacheKey = `${symbol}_${interval}_${startTime}_${endTime}`;
    return this.candleCache.get(cacheKey) || null;
  }

  /**
   * Pre-cache candle data for trades
   */
  public async preCacheTradeCandles(
    symbol: string,
    interval: string,
    tradeTimes: number[],
  ): Promise<void> {
    if (!this.readOnlySdk || tradeTimes.length === 0) return;

    try {
      const minTime = Math.min(...tradeTimes) - 60 * 60 * 1000;
      const maxTime = Math.max(...tradeTimes) + 60 * 60 * 1000;
      const cacheKey = `${symbol}_${interval}_${minTime}_${maxTime}`;

      if (!this.candleCache.has(cacheKey)) {
        const candles = await this.readOnlySdk.info.getCandleSnapshot(
          symbol,
          interval,
          minTime,
          maxTime,
        );

        if (candles && Array.isArray(candles)) {
          this.candleCache.set(cacheKey, candles);
        }
      }
    } catch (error) {
      console.error("Error pre-caching trade candles:", error);
    }
  }

  /**
   * Cleanup all subscriptions and cache
   */
  public cleanup(): void {
    this.currentSubscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.currentSubscriptions.clear();
    this.candleCache.clear();
  }

  /**
   * Helper: Convert TradingView resolution to Hyperliquid interval
   */
  private convertResolutionToInterval(resolution: string): string {
    const resolutionMap: Record<string, string> = {
      "1": "1m",
      "5": "5m",
      "15": "15m",
      "30": "30m",
      "60": "1h",
      "240": "4h",
      "1D": "1d",
    };
    return resolutionMap[resolution] || "1h";
  }

  /**
   * Helper: Extract base symbol from TradingView symbol
   */
  private extractBaseSymbol(symbol: string): string {
    return symbol.replace("-PERP", "").replace("PERP", "");
  }

  /**
   * Helper: Convert Hyperliquid candle to TradingView bar format
   */
  private convertHyperliquidCandleToBar(
    candleData: HyperliquidCandleData,
  ): Bar | null {
    try {
      if (!candleData || typeof candleData !== "object") {
        console.warn("Invalid candle data:", candleData);
        return null;
      }

      const { T, o, h, l, c, v } = candleData;

      if (
        !T ||
        o === undefined ||
        h === undefined ||
        l === undefined ||
        c === undefined
      ) {
        console.warn("Missing required candle fields:", candleData);
        return null;
      }

      return {
        time: Math.floor(T),
        open: parseFloat(o.toString()),
        high: parseFloat(h.toString()),
        low: parseFloat(l.toString()),
        close: parseFloat(c.toString()),
        volume: v ? parseFloat(v.toString()) : 0,
      };
    } catch (error) {
      console.error("Error converting candle data:", error);
      return null;
    }
  }
}
