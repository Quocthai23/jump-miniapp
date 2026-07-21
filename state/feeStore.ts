import type { UserFees } from "@/packages/hyperliquid/src";
import type { FeeRatesResult } from "@/utils/feeCalculator";
import { create } from "zustand";

export interface FeeStoreState {
  userFees: UserFees | null;
  calculatedFeeRates: FeeRatesResult | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUserFees: (fees: UserFees) => void;
  setCalculatedFeeRates: (rates: FeeRatesResult) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

const useFeeStore = create<FeeStoreState>()((set) => ({
  userFees: null,
  calculatedFeeRates: null,
  isLoading: false,
  error: null,

  setUserFees: (fees: UserFees) =>
    set((state) => ({
      userFees: fees,
      error: null,
    })),

  setCalculatedFeeRates: (rates: FeeRatesResult) =>
    set({
      calculatedFeeRates: rates,
    }),

  setIsLoading: (loading: boolean) =>
    set({
      isLoading: loading,
    }),

  setError: (error: string | null) =>
    set({
      error,
    }),

  reset: () =>
    set({
      userFees: null,
      calculatedFeeRates: null,
      isLoading: false,
      error: null,
    }),
}));

export default useFeeStore;
