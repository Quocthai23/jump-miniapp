import { useCallback } from "react";
import { useHyperliquid } from "@/contexts/HyperliquidContext";
import { useInvalidateHyperliquidQueries } from "@/hooks/useHyperliquidQueries";
import { useTrading } from "@/hooks/useTrading";
import { getAgentAddress } from "@/utils/getAgentData";
import { type MarginType } from "@/state/trading";

/**
 * Hook for adjusting trading leverage or margin mode
 */
export function useAdjustLeverage(coin: string) {
  const { getTradingSdk } = useHyperliquid();
  const { invalidateClearinghouseState } = useInvalidateHyperliquidQueries();
  const { context } = useTrading();

  /**
   * Update leverage / margin mode on-chain.
   * Leverage is passed explicitly to avoid stale closures on context.leverage.
   */
  const handleAdjustLeverage = useCallback(
    async (
      walletAddress: string,
      leverage: number,
      marginTypeOverride?: MarginType,
    ) => {
      if (!walletAddress) {
        context.setStatus({
          type: "error",
          message: "Wallet address is required.",
        });
        return;
      }

      const agentInfo = getAgentAddress(walletAddress);
      if (!agentInfo || !agentInfo.privateKey) {
        context.setStatus({
          type: "error",
          message: "Agent not approved. Please enable trading first.",
        });
        return;
      }

      context.setIsLoading(true);
      context.setStatus(null);

      try {
        const tradingSdk = await getTradingSdk(
          agentInfo.privateKey,
          agentInfo.userAddress,
        );

        const coinSymbol = coin;
        const marginMode: MarginType = marginTypeOverride ?? context.marginType;

        await tradingSdk.exchange.updateLeverage(
          coinSymbol,
          marginMode,
          leverage,
        );

        context.setStatus({
          type: "success",
          message: `Leverage set to ${leverage}x in ${marginMode} mode successfully!`,
        });

        // Invalidate queries to refresh data
        if (walletAddress) {
          invalidateClearinghouseState(walletAddress);
        }
      } catch (error: unknown) {
        context.setStatus({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to adjust leverage. Please try again.",
        });
      } finally {
        context.setIsLoading(false);
      }
    },
    [coin, getTradingSdk, invalidateClearinghouseState, context],
  );

  return { handleAdjustLeverage };
}
