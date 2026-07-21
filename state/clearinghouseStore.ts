import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface AssetPosition {
  type: "oneWay" | "twoWay";
  position: {
    coin: string;
    szi: string;
    leverage: { type: string; value: number };
    entryPx: string;
    positionValue: string;
    unrealizedPnl: string;
    returnOnEquity: string;
    liquidationPx: string;
    marginUsed: string;
    maxLeverage: number;
    cumFunding?: {
      allTime: string;
      sinceOpen: string;
      sinceChange: string;
    };
  };
}
export interface PositionDetail {
  coin: string;
  szi: string;
  leverage: { type: string; value: number };
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  liquidationPx: string;
  marginUsed: string;
  maxLeverage: number;
  cumFunding?: {
    allTime: string;
    sinceOpen: string;
    sinceChange: string;
  };
}

export interface ClearinghouseData {
  marginSummary?: {
    accountValue?: string;
  };
  withdrawable?: string;
  assetPositions?: AssetPosition[];
  [key: string]: any;
}

interface ClearinghouseState {
  // Data storage by address
  data: Record<string, ClearinghouseData | null>;
  assetPositions: AssetPosition[];
  currentPosition: PositionDetail | null;
  isLoading: Record<string, boolean>;
  isLoadingAssetPositions: boolean;
  error: Record<string, string | null>;
  lastFetch: Record<string, number>;

  // Actions
  setData: (address: string, data: ClearinghouseData | null) => void;
  setAssetPositions: (positions: AssetPosition[]) => void;
  setCurrentPosition: (position: PositionDetail | null) => void;
  setLoading: (address: string, loading: boolean) => void;
  setIsLoadingAssetPositions: (loading: boolean) => void;
  setError: (address: string, error: string | null) => void;
  clearAddress: (address: string) => void;

  // Getters
  getData: (address: string) => ClearinghouseData | null;
  getAssetPositions: () => AssetPosition[];
  getCurrentPosition: () => PositionDetail | null;
  getIsLoading: (address: string) => boolean;
  getError: (address: string) => string | null;
  shouldRefetch: (address: string, staleTime?: number) => boolean;

  // Utilities
  clearAll: () => void;
}

export const useClearinghouseStore = create<ClearinghouseState>()(
  subscribeWithSelector((set, get) => ({
    data: {},
    assetPositions: [],
    currentPosition: null,
    isLoading: {},
    isLoadingAssetPositions: true,
    error: {},
    lastFetch: {},

    setData: (address: string, data: ClearinghouseData | null) =>
      set((state) => ({
        data: { ...state.data, [address]: data },
        assetPositions: data?.assetPositions || [],
        lastFetch: { ...state.lastFetch, [address]: Date.now() },
        error: { ...state.error, [address]: null },
      })),

    setAssetPositions: (positions: AssetPosition[]) =>
      set({ assetPositions: positions, isLoadingAssetPositions: false }),

    setCurrentPosition: (position: PositionDetail | null) =>
      set({ currentPosition: position }),

    setIsLoadingAssetPositions: (loading: boolean) =>
      set({ isLoadingAssetPositions: loading }),

    setLoading: (address: string, loading: boolean) =>
      set((state) => ({
        isLoading: { ...state.isLoading, [address]: loading },
      })),

    setError: (address: string, error: string | null) =>
      set((state) => ({
        error: { ...state.error, [address]: error },
        isLoading: { ...state.isLoading, [address]: false },
      })),

    clearAddress: (address: string) =>
      set((state) => {
        const newData = { ...state.data };
        const newIsLoading = { ...state.isLoading };
        const newError = { ...state.error };
        const newLastFetch = { ...state.lastFetch };

        delete newData[address];
        delete newIsLoading[address];
        delete newError[address];
        delete newLastFetch[address];

        return {
          data: newData,
          assetPositions: [],
          currentPosition: null,
          isLoading: newIsLoading,
          isLoadingAssetPositions: true,
          error: newError,
          lastFetch: newLastFetch,
        };
      }),

    getData: (address: string) => get().data[address] || null,
    getAssetPositions: () => get().assetPositions,
    getCurrentPosition: () => get().currentPosition,
    getIsLoading: (address: string) => get().isLoading[address] || false,
    getError: (address: string) => get().error[address] || null,

    shouldRefetch: (address: string, staleTime = 30000) => {
      const lastFetch = get().lastFetch[address];
      if (!lastFetch) return true;
      return Date.now() - lastFetch > staleTime;
    },

    clearAll: () =>
      set({
        data: {},
        assetPositions: [],
        currentPosition: null,
        isLoading: {},
        isLoadingAssetPositions: true,
        error: {},
        lastFetch: {},
      }),
  })),
);
