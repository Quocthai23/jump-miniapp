import { useTradingContextStore } from "@/state/trading/tradingContextStore";

/**
 * Hook that handles hydration of the trading store from localStorage
 * This prevents hydration mismatches by ensuring client-side data is loaded after initial render
 */
export function useHydratedTradingStore() {
  const store = useTradingContextStore();

  return store;
}
