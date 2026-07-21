import { create } from "zustand";
import { useMarketDataStore } from "../market";
import { fromDisplayToSymbol } from "utils/displayCoin";

export type ActiveTab = "long" | "short";
export type MarginType = "isolated" | "cross";

export interface StatusMessage {
  type: "success" | "error" | "info";
  message: string;
}

export interface TradingContextState {
  // ============ UI/Status State ============
  isLoading: boolean;
  status: StatusMessage | null;
  leverageDialogOpen: boolean;

  // ============ Trading Status ============
  isTradingEnabled: boolean | null;
  activeTab: ActiveTab;

  // ============ Position & Leverage ============
  leverage: number;
  tempLeverage: number;
  marginType: MarginType;

  // ============ Account Information ============
  perpsBalance: string | null;
  lastNonce: number;

  // ============ Current Pair ============
  selectedCoin: string;
  isHydrated: boolean;

  // ============ Setters - UI/Status ============
  setIsLoading: (loading: boolean) => void;
  setStatus: (status: StatusMessage | null) => void;
  setLeverageDialogOpen: (open: boolean) => void;
  clearStatus: () => void;

  // ============ Setters - Trading ============
  setIsTradingEnabled: (enabled: boolean | null) => void;
  setActiveTab: (tab: ActiveTab) => void;

  // ============ Setters - Position & Leverage ============
  setLeverage: (leverage: number) => void;
  setTempLeverage: (leverage: number) => void;
  setMarginType: (type: MarginType) => void;

  // ============ Setters - Account Info ============
  setPerpsBalance: (balance: string | null) => void;
  setLastNonce: (nonce: number) => void;

  // ============ Setters - Pair Selection ============
  setSelectedCoin: (coin: string) => void;

  // ============ Utility Actions ============
  generateUniqueNonce: () => number;
}

export const useTradingContextStore = create<TradingContextState>(
  (set, get) => ({
    // Initial values
    isLoading: false,
    status: null,
    leverageDialogOpen: false,
    isTradingEnabled: null,
    activeTab: "long",
    leverage: 1,
    tempLeverage: 1,
    marginType: "isolated",
    perpsBalance: null,
    lastNonce: 0,
    selectedCoin: "", // Always start with default for SSR
    isHydrated: false,

    // Setters - UI/Status
    setIsLoading: (loading) => set({ isLoading: loading }),
    setStatus: (status) => set({ status }),
    setLeverageDialogOpen: (open) => set({ leverageDialogOpen: open }),
    clearStatus: () => set({ status: null }),

    // Setters - Trading
    setIsTradingEnabled: (enabled) => set({ isTradingEnabled: enabled }),
    setActiveTab: (tab) => set({ activeTab: tab }),

    // Setters - Position & Leverage
    setLeverage: (leverage) => set({ leverage }),
    setTempLeverage: (leverage) => set({ tempLeverage: leverage }),
    setMarginType: (type) => set({ marginType: type }),

    // Setters - Account Info
    setPerpsBalance: (balance) => set({ perpsBalance: balance }),
    setLastNonce: (nonce) => set({ lastNonce: nonce }),

    // Setters - Pair Selection
    setSelectedCoin: (coin) => {
      // Reset leverage to 1x when changing coins to avoid confusion
      set({
        selectedCoin: coin,
        leverage: 1,
        tempLeverage: 1,
      });
      const setSymbolData = useMarketDataStore.getState().setSymbolData;
      setSymbolData(fromDisplayToSymbol(coin));
    },

    // Utility Actions
    generateUniqueNonce: () => {
      const state = get();
      const timestamp = Math.floor(Date.now());

      if (timestamp <= state.lastNonce) {
        const newNonce = state.lastNonce + 1;
        set({ lastNonce: newNonce });
        return newNonce;
      }

      set({ lastNonce: timestamp });
      return timestamp;
    },
  }),
);
