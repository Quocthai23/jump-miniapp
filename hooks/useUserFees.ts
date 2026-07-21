import { useHyperliquid } from "@/contexts/HyperliquidContext";
import useFeeStore from "@/state/feeStore";
import { calculatePerpFee } from "@/utils/feeCalculator";
import { useEffect, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { useHydratedTradingStore } from "./useHydratedTradingStore";

interface UseUserFeesOptions {
  enabled?: boolean;
  args?: Parameters<typeof calculatePerpFee>[3]; // Args for feeRates calculation
}

/**
 * Hook to fetch and manage user fees
 * @param options Configuration options
 * @returns Object containing fees data and loading state
 */
export function useUserFees(options: UseUserFeesOptions = {}) {
  const {
    enabled = true,
    args = { type: "perp", deployerFeeScale: 0, growthMode: false },
  } = options;

  const { readOnlySdk } = useHyperliquid();
  const { address: walletAddress } = useAccount();
  const { selectedCoin } = useHydratedTradingStore();

  const { userFees, isLoading, setUserFees, setIsLoading, setError } =
    useFeeStore();

  const fetchUserFees = useCallback(async () => {
    if (!walletAddress || !readOnlySdk || !enabled) return;

    try {
      setIsLoading(true);
      const fees = await readOnlySdk.info.userFees(walletAddress);
      setUserFees(fees);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch fees");
    } finally {
      setIsLoading(false);
    }
  }, [
    walletAddress,
    enabled,
    readOnlySdk,
    setUserFees,
    setIsLoading,
    setError,
  ]);

  const calculatedRates = useMemo(() => {
    if (!userFees) return null;

    return calculatePerpFee(
      {
        makerRate: parseFloat(userFees.userAddRate || "0"),
        takerRate: parseFloat(userFees.userCrossRate || "0"),
      },
      parseFloat(userFees.activeReferralDiscount || "0"),
      true, // isAlignedQuoteToken
      args,
    );
  }, [userFees, args, selectedCoin]);

  useEffect(() => {
    fetchUserFees();
  }, [fetchUserFees]);

  return {
    userFees,
    makerPercentage: calculatedRates?.makerPercentage,
    takerPercentage: calculatedRates?.takerPercentage,
    isLoading,
    refetch: fetchUserFees,
  };
}
