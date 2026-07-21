import { SkeletonBalance } from "packages/ui/src/components/shared/atoms/skeleton";
import { useTrading } from "@/hooks/useTrading";
import { useTradingContextStore } from "@/state/trading";
import { useClearinghouseState } from "@/hooks/useHyperliquidQueries";
import { useAccount } from "wagmi";
import { useMemo } from "react";
import { fromDisplayToSymbol } from "@/utils/displayCoin";

interface BalanceInfoProps {
  isLoadingBalance: boolean;
}

export function BalanceInfo({ isLoadingBalance }: BalanceInfoProps) {
  const { context } = useTrading();
  const { selectedCoin: coin, activeTab } = useTradingContextStore();
  const { address: walletAddress } = useAccount();
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

  const coinAmountDisplay = useMemo(() => {
    if (!currentPosition) {
      return "0";
    }

    return currentPosition.szi;
  }, [currentPosition]);

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-body-md-regular text-neutral-300">Available</span>
        {isLoadingBalance || context.perpsBalance === null ? (
          <SkeletonBalance width={80} />
        ) : (
          <span className="text-body-md-medium text-neutral-50">
            {context.perpsBalance === "N/A"
              ? "0.00 USDC"
              : `${effectiveBalanceUSDC.toFixed(2)} USDC`}
          </span>
        )}
      </div>

      <div className="mt-[-4px] flex items-center justify-between">
        <span className="text-body-md-regular text-neutral-300">
          Current Position
        </span>
        {isLoadingBalance || context.perpsBalance === null ? (
          <SkeletonBalance width={80} />
        ) : (
          <span className="text-body-md-medium text-neutral-50">
            {coinAmountDisplay} {fromDisplayToSymbol(coin)}
          </span>
        )}
      </div>
    </>
  );
}
