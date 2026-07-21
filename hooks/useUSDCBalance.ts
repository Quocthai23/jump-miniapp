import { useMemo } from "react";
import { useClearinghouseState } from "@/hooks/useHyperliquidQueries";
import { useTradingContextStore } from "@/state/trading/tradingContextStore";
import { useTrading } from "@/hooks/useTrading";

interface UseUSDCBalanceReturn {
  unrealizedPnlUSDC: number;
  marginUsedUSDC: number;
  accountValueUSDC: number;
  withdrawableUSDC: number;
  balanceUSDC: number;
  effectiveBalanceUSDC: number;
}

export const useUSDCBalance = (
  walletAddress: string | undefined,
): UseUSDCBalanceReturn => {
  const { selectedCoin: coin, activeTab } = useTradingContextStore();
  const { context } = useTrading();
  const { data: perpsState } = useClearinghouseState(walletAddress || "");

  const currentPosition = useMemo(() => {
    if (!perpsState?.assetPositions?.length || !coin) return null;

    return perpsState.assetPositions.find((p: any) => p.position?.coin === coin)
      ?.position;
  }, [perpsState, coin]);

  const currentPositionSide: "long" | "short" | null = useMemo(() => {
    if (!currentPosition || !currentPosition.szi) return null;
    const size = parseFloat(currentPosition.szi);
    if (!Number.isFinite(size) || size === 0) return null;
    return size > 0 ? "long" : "short";
  }, [currentPosition]);

  const unrealizedPnlUSDC = useMemo(() => {
    if (!currentPosition?.unrealizedPnl) return 0;
    const parsed = parseFloat(currentPosition.unrealizedPnl);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [currentPosition]);

  const marginUsedUSDC = useMemo(() => {
    if (!currentPosition?.marginUsed) return 0;
    const parsed = parseFloat(currentPosition.marginUsed);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [currentPosition]);

  const accountValueUSDC = useMemo(() => {
    if (!perpsState) return 0;
    const raw = (perpsState as any)?.marginSummary?.accountValue;
    const parsed = typeof raw === "string" ? parseFloat(raw) : Number(raw ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [perpsState]);

  const withdrawableUSDC = useMemo(() => {
    if (!perpsState || perpsState.withdrawable == null) return 0;
    const raw = perpsState.withdrawable as number | string;
    const parsed = typeof raw === "string" ? parseFloat(raw) : Number(raw ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [perpsState]);

  const balanceUSDC = useMemo(() => {
    if (accountValueUSDC > 0) {
      const balance = accountValueUSDC - unrealizedPnlUSDC;
      return Number.isFinite(balance) && balance > 0 ? balance : 0;
    }

    if (!context.perpsBalance || context.perpsBalance === "N/A") {
      return 0;
    }

    const parsed = parseFloat(context.perpsBalance.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [accountValueUSDC, unrealizedPnlUSDC, context.perpsBalance]);

  const effectiveBalanceUSDC = useMemo(() => {
    if (!currentPositionSide) {
      return withdrawableUSDC || balanceUSDC;
    }

    const isOppositeSide = currentPositionSide !== activeTab;

    if (isOppositeSide) {
      return balanceUSDC + marginUsedUSDC;
    }

    return withdrawableUSDC || balanceUSDC;
  }, [
    balanceUSDC,
    withdrawableUSDC,
    currentPositionSide,
    activeTab,
    marginUsedUSDC,
    unrealizedPnlUSDC,
  ]);

  return {
    unrealizedPnlUSDC,
    marginUsedUSDC,
    accountValueUSDC,
    withdrawableUSDC,
    balanceUSDC,
    effectiveBalanceUSDC,
  };
};
