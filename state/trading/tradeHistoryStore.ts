import type { UserFills } from "@/packages/hyperliquid/src";
import { create } from "zustand";

export interface FundingHistoryItem {
  coin: string;
  funding: string | number;
  time: number;
  hash: string;
}

export interface OrderHistoryItem {
  order: {
    oid: number;
    coin: string;
    side: string;
    sz: string | number;
    px: string | number;
    reduce_only?: boolean;
    order_type: any;
    orderType?: string;
    origSz?: string | number;
    limitPx?: string | number;
    triggerCondition?: string;
    reduceOnly?: boolean;
    isPositionTpsl?: boolean;
    triggerPx?: number;
  };
  status: string;
  time: number;
  statusTimestamp?: number;
}

export interface TwapFillItem {
  coin: string;
  px: string | number;
  sz: string | number;
  side: string;
  time: number;
  twapId: string | number;
  // Additional fields for Fill History
  closedPnl?: string;
  fee?: string;
  feeToken?: string;
  hash?: string;
  // Additional fields for Active/History tabs
  executedSz?: string | number;
  minutes?: number;
  reduceOnly?: boolean;
  randomize?: boolean;
  status?: "finished" | "activated" | "terminated" | "error";
  description?: string;
  executedNtl?: string;
  timestamp?: number;
}

export interface TimeRange {
  now: number;
  sevenDaysAgo: number;
  thirtyDaysAgo: number;
}

// ============ Store State Interface ============
export interface TradeHistoryState {
  // ============ Data State ============
  tradeHistory: UserFills;
  fundingHistory: FundingHistoryItem[];
  orderHistory: OrderHistoryItem[];
  twapFills: TwapFillItem[];

  // ============ Loading States ============
  isLoadingTradeHistory: boolean;
  isLoadingFundingHistory: boolean;
  isLoadingOrderHistory: boolean;
  isLoadingTwap: boolean;

  // ============ Error States ============
  tradeHistoryError: string | null;
  fundingHistoryError: string | null;
  orderHistoryError: string | null;
  twapError: string | null;

  // ============ Filter State ============
  selectedCoin: string | null;
  timeRange: TimeRange;

  // ============ Pagination ============
  maxResults: number;

  // ============ Actions - Data Setters ============
  setTradeHistory: (data: UserFills) => void;
  setFundingHistory: (data: FundingHistoryItem[]) => void;
  setOrderHistory: (data: OrderHistoryItem[]) => void;
  setTwapFills: (data: TwapFillItem[]) => void;

  // ============ Actions - Loading States ============
  setLoadingTradeHistory: (loading: boolean) => void;
  setLoadingFundingHistory: (loading: boolean) => void;
  setLoadingOrderHistory: (loading: boolean) => void;
  setLoadingTwap: (loading: boolean) => void;

  // ============ Actions - Error States ============
  setTradeHistoryError: (error: string | null) => void;
  setFundingHistoryError: (error: string | null) => void;
  setOrderHistoryError: (error: string | null) => void;
  setTwapError: (error: string | null) => void;

  // ============ Actions - Filters ============
  setSelectedCoin: (coin: string | null) => void;
  updateTimeRange: () => void;
  setMaxResults: (max: number) => void;

  // ============ Computed/Filtered Data ============
  getFilteredTradeHistory: () => UserFills;
  getFilteredFundingHistory: () => FundingHistoryItem[];
  getFilteredOrderHistory: () => OrderHistoryItem[];
  getFilteredTwapFills: () => TwapFillItem[];

  // ============ Utility Actions ============
  clearAllData: () => void;
  clearErrors: () => void;
  resetToDefaults: () => void;
}

// ============ Initial State ============
const createInitialState = () => ({
  // Data
  tradeHistory: [],
  fundingHistory: [],
  orderHistory: [],
  twapFills: [],

  // Loading states
  isLoadingTradeHistory: false,
  isLoadingFundingHistory: false,
  isLoadingOrderHistory: false,
  isLoadingTwap: false,

  // Error states
  tradeHistoryError: null,
  fundingHistoryError: null,
  orderHistoryError: null,
  twapError: null,

  // Filters
  selectedCoin: null,
  timeRange: {
    now: Date.now(),
    sevenDaysAgo: Date.now() - 7 * 24 * 60 * 60 * 1000,
    thirtyDaysAgo: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },

  // Pagination
  maxResults: 50,
});

// ============ Store Implementation ============
export const useTradeHistoryStore = create<TradeHistoryState>((set, get) => ({
  ...createInitialState(),

  // ============ Data Setters ============
  setTradeHistory: (data) => {
    set({ tradeHistory: data });
  },
  setFundingHistory: (data) => {
    set({ fundingHistory: data });
  },
  setOrderHistory: (data) => {
    set({ orderHistory: data });
  },
  setTwapFills: (data) => {
    set({ twapFills: data });
  },

  // ============ Loading State Setters ============
  setLoadingTradeHistory: (loading) => set({ isLoadingTradeHistory: loading }),
  setLoadingFundingHistory: (loading) =>
    set({ isLoadingFundingHistory: loading }),
  setLoadingOrderHistory: (loading) => set({ isLoadingOrderHistory: loading }),
  setLoadingTwap: (loading) => set({ isLoadingTwap: loading }),

  // ============ Error State Setters ============
  setTradeHistoryError: (error) => set({ tradeHistoryError: error }),
  setFundingHistoryError: (error) => set({ fundingHistoryError: error }),
  setOrderHistoryError: (error) => set({ orderHistoryError: error }),
  setTwapError: (error) => set({ twapError: error }),

  // ============ Filter Actions ============
  setSelectedCoin: (coin) => set({ selectedCoin: coin }),

  updateTimeRange: () => {
    const now = Date.now();
    set({
      timeRange: {
        now,
        sevenDaysAgo: now - 7 * 24 * 60 * 60 * 1000,
        thirtyDaysAgo: now - 30 * 24 * 60 * 60 * 1000,
      },
    });
  },

  setMaxResults: (max) => set({ maxResults: max }),

  // ============ Filtered Data Getters ============
  getFilteredTradeHistory: () => {
    const { tradeHistory, selectedCoin, maxResults } = get();
    let filtered = tradeHistory;

    if (selectedCoin) {
      filtered = tradeHistory.filter((fill) => {
        const fillCoin = fill.coin?.replace("-PERP", "") || "";
        const selected = selectedCoin.replace("-PERP", "");
        return fillCoin === selected;
      });
    }

    return filtered;
  },

  getFilteredFundingHistory: () => {
    const { fundingHistory, selectedCoin, maxResults } = get();
    let filtered = fundingHistory;

    if (selectedCoin) {
      filtered = fundingHistory.filter((entry) => {
        const entryCoin = entry.coin?.replace("-PERP", "") || "";
        const selected = selectedCoin.replace("-PERP", "");
        return entryCoin === selected;
      });
    }

    return filtered.slice(0, maxResults);
  },

  getFilteredOrderHistory: () => {
    const { orderHistory, selectedCoin, maxResults } = get();
    let filtered = orderHistory;

    if (selectedCoin) {
      filtered = orderHistory.filter((order) => {
        const orderCoin = order.order?.coin?.replace("-PERP", "") || "";
        const selected = selectedCoin.replace("-PERP", "");
        return orderCoin === selected;
      });
    }

    return filtered.slice(0, maxResults);
  },

  getFilteredTwapFills: () => {
    const { twapFills, selectedCoin, maxResults } = get();
    let filtered = twapFills;

    if (selectedCoin) {
      filtered = twapFills.filter((fill) => {
        const fillCoin = fill.coin?.replace("-PERP", "") || "";
        const selected = selectedCoin.replace("-PERP", "");
        return fillCoin === selected;
      });
    }

    return filtered.slice(0, maxResults);
  },

  // ============ Utility Actions ============
  clearAllData: () =>
    set({
      tradeHistory: [],
      fundingHistory: [],
      orderHistory: [],
      twapFills: [],
    }),

  clearErrors: () =>
    set({
      tradeHistoryError: null,
      fundingHistoryError: null,
      orderHistoryError: null,
      twapError: null,
    }),

  resetToDefaults: () => set(createInitialState()),
}));
