import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";

export type MarketData = {
  name: string;
  symbol: string;
  price: number;
  maxLeverage: number;
  change24h: number;
  marginTable: {
    lowerBound: number;
    maxLeverage: number;
  }[];
  decimals: number;
  marginTableId: number;
  openInterest: number;
  prevPrice: number;
  szDecimals: number;
  volume24h: number;
  oraclePx: number;
  volumeBase24h?: number;
  funding: number;
  onlyIsolated?: boolean;
  marginMode?: string;
};

export interface MarketDataState {
  marketData: MarketData[] | null;
  currentSymbolData: MarketData | null;
  isLoading: boolean;
  isHydrated: boolean; // Flag to track if data has been hydrated from server
  setMarketData: (data: MarketData[]) => void;
  setIsLoading: (loading: boolean) => void;
  setCurrentSymbolData: (data: MarketData | null) => void;
  setSymbolData: (symbol: string) => void;
  setHydrated: (hydrated: boolean) => void;

  updatePartialCurrentSymbolData: (partialData: Partial<MarketData>) => void;
  updateMarketPriceBySymbol: (symbol: string, price: number) => void;
}

export const useMarketDataStore = create<MarketDataState>()(
  devtools(
    immer((set, get) => ({
      marketData: null,
      isLoading: true,
      currentSymbolData: null,
      isHydrated: false,

      setMarketData: (data) => {
        // Only set if we have valid data
        if (data && Array.isArray(data) && data.length > 0) {
          set({ marketData: data, isLoading: false });
        }
      },
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setCurrentSymbolData: (data) => set({ currentSymbolData: data }),

      updatePartialCurrentSymbolData: (partialData: Partial<MarketData>) =>
        set((state) => {
          if (state.currentSymbolData) {
            state.currentSymbolData = {
              ...state.currentSymbolData,
              ...partialData,
            };
          }
        }),

      updateMarketPriceBySymbol: (symbol: string, price: number) =>
        set((state) => {
          if (!state.marketData) return;
          const marketIndex = state.marketData.findIndex(
            (market) =>
              market.symbol === symbol ||
              market.name === symbol.toUpperCase() ||
              market.name === `${symbol.toUpperCase()}-PERP`,
          );
          if (marketIndex === -1) return;
          const market = state.marketData[marketIndex];
          if (!market) return;
          // Calculate change24h from the original prevPrice (24h ago price)
          const change24h =
            market.prevPrice > 0
              ? ((price - market.prevPrice) / market.prevPrice) * 100
              : 0;
          // Mutate directly with immer
          market.price = price;
          market.change24h = change24h;
        }),

      setSymbolData: (symbol: string) => {
        const marketData = get().marketData;
        if (marketData) {
          // Try to find by symbol first, then by name (which includes -PERP)
          const symbolData =
            marketData.find((data) => data.symbol === symbol) ||
            marketData.find(
              (data) =>
                data.name === symbol.toUpperCase() ||
                data.name === `${symbol.toUpperCase()}-PERP`,
            );
          set({ currentSymbolData: symbolData || null });
        }
      },
    })),
  ),
);

export const getMarketData = () => {
  return useMarketDataStore.getState().marketData;
};

export const getCurrentSymbolData = () => {
  return useMarketDataStore.getState().currentSymbolData;
};
