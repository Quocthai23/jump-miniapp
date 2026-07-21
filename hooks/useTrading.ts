/**
 * Composite hook to access all trading stores
 * Provides a single import point for all trading state management
 *
 * Usage:
 * const { form, context } = useTrading();
 */

import { useOrderFormStore } from "@/state/trading/orderFormStore";
import { useTradingContextStore } from "@/state/trading/tradingContextStore";

export const useTrading = () => {
  // Zustand store hooks return the same reference across renders,
  // so we don't need useMemo here
  const form = useOrderFormStore();
  const context = useTradingContextStore();

  return {
    form,
    context,
  };
};
