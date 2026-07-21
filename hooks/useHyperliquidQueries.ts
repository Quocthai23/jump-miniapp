import { useHyperliquid } from "@/contexts/HyperliquidContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useMarketDataStore } from "@/state/market";
import { useTradingContextStore } from "@/state/trading";
import { useOpenOrdersStore } from "@/state/openOrdersStore";
import { useParams } from "react-router";

// Query Keys Factory
export const queryKeys = {
  allMids: ["hyperliquid", "allMids"] as const,
  allAssets: ["hyperliquid", "allAssets"] as const,
  candleSnapshot: (coin: string, interval: string) =>
    ["hyperliquid", "candleSnapshot", coin, interval] as const,
  metaAndAssetCtxs: ["hyperliquid", "metaAndAssetCtxs"] as const,
  assetIndex: (coin: string) => ["hyperliquid", "assetIndex", coin] as const,
  clearinghouseState: (address: string) =>
    ["hyperliquid", "clearinghouseState", address] as const,
  spotClearinghouseState: (address: string) =>
    ["hyperliquid", "spotClearinghouseState", address] as const,
  userOpenOrders: (address: string) =>
    ["hyperliquid", "userOpenOrders", address] as const,
  userTwapSliceFills: (address: string) =>
    ["hyperliquid", "userTwapSliceFills", address] as const,
  userTwapHistory: (address: string) =>
    ["hyperliquid", "userTwapHistory", address] as const,
  userTwapActive: (address: string) =>
    ["hyperliquid", "userTwapActive", address] as const,
  userFillsByTime: (address: string, startTime: number, endTime: number) =>
    ["hyperliquid", "userFillsByTime", address, startTime, endTime] as const,
  userFunding: (address: string, startTime: number, endTime: number) =>
    ["hyperliquid", "userFunding", address, startTime, endTime] as const,
  historicalOrders: (address: string) =>
    ["hyperliquid", "historicalOrders", address] as const,
  spotMeta: ["hyperliquid", "spotMeta"] as const,
};

// Get all mids (prices)
export function useAllMids() {
  const { readOnlySdk } = useHyperliquid();

  return useQuery({
    queryKey: queryKeys.allMids,
    queryFn: async () => {
      const startTime = Date.now();

      if (!readOnlySdk) throw new Error("SDK not initialized");

      try {
        // Add request timeout to prevent hanging
        const timeoutPromise = new Promise(
          (_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), 8000), // 8 second timeout for prices
        );

        const result = await Promise.race([
          readOnlySdk.info.getAllMids(),
          timeoutPromise,
        ]);

        const duration = Date.now() - startTime;
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ getAllMids failed after ${duration}ms:`, error);
        throw error;
      }
    },
    enabled: !!readOnlySdk,
    staleTime: 1000 * 60 * 5, // 5 minutes - aggressive caching for mids too
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    networkMode: "always", // Always try to fetch
    structuralSharing: false, // Disable to avoid deep comparisons
    refetchInterval: false, // Disable automatic refetching
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchOnReconnect: false, // Don't refetch on reconnect
    retry: (failureCount, error) => {
      // Don't retry for SDK initialization errors or known API errors
      if (error.message === "SDK not initialized") return false;
      if (error.message?.includes("HyperliquidAPIError")) return false;
      if (error.message?.includes("unknown error occurred")) return false;
      return failureCount < 1; // Faster recovery
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 1000), // Faster retry
  });
}

// Get all assets
export function useAllAssets() {
  const { readOnlySdk } = useHyperliquid();

  return useQuery({
    queryKey: queryKeys.allAssets,
    queryFn: async () => {
      const startTime = Date.now();

      if (!readOnlySdk) throw new Error("SDK not initialized");

      try {
        // Add request timeout to prevent hanging
        const timeoutPromise = new Promise(
          (_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), 10000), // 10 second timeout
        );

        const result = await Promise.race([
          readOnlySdk.info.getAllAssets(),
          timeoutPromise,
        ]);

        const duration = Date.now() - startTime;
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ getAllAssets failed after ${duration}ms:`, error);
        throw error;
      }
    },
    enabled: !!readOnlySdk,
    staleTime: 1000 * 60 * 30, // 30 minutes - very aggressive caching
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    networkMode: "always", // Always try to fetch
    structuralSharing: false, // Disable to avoid deep comparisons
    retry: (failureCount, error) => {
      // Don't retry for SDK initialization errors or known API errors
      if (error.message === "SDK not initialized") return false;
      if (error.message?.includes("HyperliquidAPIError")) return false;
      if (error.message?.includes("unknown error occurred")) return false;
      return failureCount < 1; // Fewer retries for faster recovery
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 1000), // Faster retry
  });
}

// Get candle snapshot
export function useCandleSnapshot(
  coin: string,
  interval: "1m" | "5m" | "15m" | "1h" | "4h" | "1d",
  enabled: boolean = true,
) {
  const { readOnlySdk } = useHyperliquid();

  return useQuery({
    // Query key only includes coin and interval - completely stable
    queryKey: queryKeys.candleSnapshot(coin, interval),
    queryFn: async () => {
      if (!readOnlySdk) throw new Error("SDK not initialized");
      // Don't wait for full initialization for candle data

      // Calculate time range based on interval
      const now = Date.now();
      let daysBack = 7; // 7 days for 1h interval
      if (interval === "4h") {
        daysBack = 30; // 30 days for 4h interval
      } else if (interval === "1d") {
        daysBack = 90; // 90 days for 1d interval
      }

      const startTime = now - daysBack * 24 * 60 * 60 * 1000;
      const endTime = now;

      return await readOnlySdk.info.getCandleSnapshot(
        coin,
        interval,
        startTime,
        endTime,
      );
    },
    enabled: !!readOnlySdk && enabled && !!coin,
    staleTime: 1000 * 60, // 1 minute - data is fresh for 1 minute
    // Disable all automatic refetching to prevent loops
    refetchInterval: false, // Disable auto-refetch - manual refresh only
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchOnReconnect: false, // Don't refetch on reconnect
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });
}

export function useMetaAndAssetCtxs(enabled: boolean = true) {
  const { readOnlySdk } = useHyperliquid();
  const { symbol } = useParams<{ symbol: string }>();

  const setMarketData = useMarketDataStore((state) => state.setMarketData);
  const marketData = useMarketDataStore((state) => state.marketData);
  const currentSymbolData = useMarketDataStore(
    (state) => state.currentSymbolData,
  );
  const setCurrentSymbolData = useMarketDataStore(
    (state) => state.setCurrentSymbolData,
  );
  const setSelectedCoin = useTradingContextStore(
    (state) => state.setSelectedCoin,
  );

  const queryData = useQuery({
    queryKey: ["metaAndAssetCtxs"],
    queryFn: async () => {
      if (!readOnlySdk) throw new Error("SDK not initialized");

      const result = await readOnlySdk.info.perpetuals.getMetaAndAssetCtxs();

      if (result) {
        const universeData = result[0] ? result[0]?.universe || [] : [];
        const marginTable = result[0]
          ? (result[0] as any)?.marginTables || []
          : [];

        const assetCtxsData = result[1] ? result[1] || [] : [];

        if (universeData?.length > 0 && assetCtxsData?.length > 0) {
          const formattedMarketData = universeData.map(
            (universe: any, index: number) => {
              const assetCtx = assetCtxsData[index];

              const price = parseFloat(assetCtx?.markPx as string);
              const prevPrice = parseFloat(assetCtx?.prevDayPx as string);
              const change24h =
                prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0;
              const volume24h = parseFloat(assetCtx?.dayNtlVlm as string);
              const openInterest =
                parseFloat(assetCtx?.openInterest as string) *
                parseFloat(assetCtx?.oraclePx as string);
              const decimals = price.toString().split(".")[1]?.length ?? 0;

              const currentMarginTable = marginTable.find((m: any) => {
                if (m[0] === universe.marginTableId) {
                  return true;
                }
                return false;
              });

              const data = {
                ...universe,
                symbol: universe.name.replace("-PERP", ""),
                decimals,
                price,
                prevPrice,
                change24h,
                volume24h,
                openInterest,
                marginTable: currentMarginTable
                  ? currentMarginTable[1]?.marginTiers
                  : [],
              };
              return data;
            },
          );
          return formattedMarketData;
        }
        return [];
      }
      return [];
    },
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: true,
  });

  const { data, isLoading } = queryData;

  useEffect(() => {
    if (isLoading || !data) return;

    const isHydrated = useMarketDataStore.getState().isHydrated;

    // Only seed market data if store is empty AND not yet hydrated from server
    // This prevents overwriting server-side hydrated data
    // if ((!marketData || marketData.length === 0) && !isHydrated) {
    //   setMarketData(data);
    // }

    // Initialize current symbol once from URL if not set
    if (symbol && !currentSymbolData) {
      const realSymbol = symbol?.toLowerCase()?.includes("perp")
        ? symbol
        : symbol + "-PERP";
      const symbolData = data.find(
        (item) => item.name === realSymbol.toUpperCase(),
      );
      setCurrentSymbolData(symbolData || null);
      setSelectedCoin(realSymbol.toUpperCase());
    }
  }, [
    data,
    isLoading,
    setMarketData,
    setSelectedCoin,
    currentSymbolData,
    setCurrentSymbolData,
    symbol,
    marketData,
  ]);
  return queryData;
}

// Get asset index
export function useAssetIndex(coin: string, enabled: boolean = true) {
  const { readOnlySdk } = useHyperliquid();

  return useQuery({
    queryKey: queryKeys.assetIndex(coin),
    queryFn: async () => {
      if (!readOnlySdk) throw new Error("SDK not initialized");
      // Don't wait for full initialization for asset index
      const assetIndex = await readOnlySdk.symbolConversion.getAssetIndex(coin);
      // React Query doesn't allow undefined, return null instead
      return assetIndex ?? null;
    },
    enabled: !!readOnlySdk && enabled && !!coin,
    staleTime: 1000 * 60 * 10, // 10 minutes - asset indices don't change
  });
}

// Get clearinghouse state (perps)
export function useClearinghouseState(
  address: string | undefined,
  enabled: boolean = true,
) {
  const { readOnlySdk } = useHyperliquid();

  return useQuery({
    queryKey: queryKeys.clearinghouseState(address || ""),
    queryFn: async () => {
      if (!readOnlySdk || !address)
        throw new Error("SDK not initialized or no address");
      const normalizedAddress = address.toLowerCase();
      return await readOnlySdk.info.perpetuals.getClearinghouseState(
        normalizedAddress,
      );
    },
    enabled: !!readOnlySdk && enabled && !!address,
    staleTime: 1000 * 20, // 20 seconds - balances change frequently
    refetchInterval: 1000 * 20, // Refetch every 20 seconds
    gcTime: 1000 * 20, // Keep in cache for 20 seconds
  });
}

// Get spot clearinghouse state
export function useSpotClearinghouseState(
  address: string | undefined,
  enabled: boolean = true,
) {
  const { readOnlySdk } = useHyperliquid();

  return useQuery({
    queryKey: queryKeys.spotClearinghouseState(address || ""),
    queryFn: async () => {
      if (!readOnlySdk || !address)
        throw new Error("SDK not initialized or no address");
      const normalizedAddress = address.toLowerCase();
      return await readOnlySdk.info.spot.getSpotClearinghouseState(
        normalizedAddress,
      );
    },
    enabled: !!readOnlySdk && enabled && !!address,
    staleTime: 1000 * 10, // 10 seconds
    refetchInterval: 1000 * 20, // Refetch every 20 seconds
  });
}

// Get user open orders
export function useUserOpenOrders(
  address: string | undefined,
  enabled: boolean = true,
) {
  const { readOnlySdk } = useHyperliquid();

  return useQuery({
    queryKey: queryKeys.userOpenOrders(address || ""),
    queryFn: async () => {
      if (!readOnlySdk || !address)
        throw new Error("SDK not initialized or no address");
      const normalizedAddress = address.toLowerCase();
      const frontendOrders =
        await readOnlySdk.info.getFrontendOpenOrders(normalizedAddress);
      return frontendOrders;
    },
    enabled: !!readOnlySdk && enabled && !!address,
    staleTime: Infinity, // Never stale - only refetch on manual invalidation
    refetchInterval: false, // Disable automatic refetching
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
}

// Get user TWAP slice fills - always fetches data for active, history, and fill
export function useUserTwapSliceFills(
  address: string | undefined,
  enabled: boolean = true,
) {
  const { readOnlySdk } = useHyperliquid();

  return useQuery({
    queryKey: queryKeys.userTwapSliceFills(address || ""),
    queryFn: async () => {
      if (!readOnlySdk || !address)
        throw new Error("SDK not initialized or no address");
      const normalizedAddress = address.toLowerCase();

      // Add request timeout to prevent hanging
      const timeoutPromise = new Promise(
        (_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 8000), // 8 second timeout
      );

      const result = await Promise.race([
        readOnlySdk.info.getUserTwapSliceFills(normalizedAddress),
        timeoutPromise,
      ]);

      return result;
    },
    enabled: !!readOnlySdk && enabled && !!address, // Enabled when SDK, address available and enabled flag is true
    staleTime: 1000 * 5, // 5 seconds - faster refresh like open orders
    refetchInterval: 1000 * 10, // Refetch every 10 seconds to keep data fresh
    gcTime: 1000 * 20, // Keep in cache for 20 seconds
    retry: (failureCount, error) => {
      // Don't retry for SDK initialization errors or known API errors
      if (error.message === "SDK not initialized") return false;
      if (error.message?.includes("HyperliquidAPIError")) return false;
      if (error.message?.includes("Request timeout")) return false;
      return failureCount < 1; // Faster recovery
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 1000), // Faster retry
  });
}

// Get user TWAP history - fetches TWAP orders (active and history)
export function useUserTwapHistory(
  address: string | undefined,
  enabled: boolean = true,
) {
  const { readOnlySdk } = useHyperliquid();

  return useQuery({
    queryKey: queryKeys.userTwapHistory(address || ""),
    queryFn: async () => {
      if (!readOnlySdk || !address)
        throw new Error("SDK not initialized or no address");
      const normalizedAddress = address.toLowerCase();

      // Add request timeout to prevent hanging
      const timeoutPromise = new Promise(
        (_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 8000), // 8 second timeout
      );

      const result = await Promise.race([
        readOnlySdk.info.twapHistory(normalizedAddress),
        timeoutPromise,
      ]);

      return result;
    },
    enabled: !!readOnlySdk && enabled && !!address,
    staleTime: 1000 * 5, // 5 seconds - faster refresh like open orders
    refetchInterval: 1000 * 10, // Refetch every 10 seconds to keep data fresh
    gcTime: 1000 * 20, // Keep in cache for 20 seconds
    retry: (failureCount, error) => {
      // Don't retry for SDK initialization errors or known API errors
      if (error.message === "SDK not initialized") return false;
      if (error.message?.includes("HyperliquidAPIError")) return false;
      if (error.message?.includes("Request timeout")) return false;
      return failureCount < 1; // Faster recovery
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 1000), // Faster retry
  });
}

// Get user fills by time
export function useUserFillsByTime(
  address: string | undefined,
  startTime: number,
  endTime: number,
  enabled: boolean = true,
) {
  const { readOnlySdk } = useHyperliquid();

  return useQuery({
    queryKey: queryKeys.userFillsByTime(address || "", startTime, endTime),
    queryFn: async () => {
      if (!readOnlySdk || !address) {
        throw new Error("SDK not initialized or no address");
      }
      const normalizedAddress = address.toLowerCase();
      const fills = await readOnlySdk.info.getUserFillsByTime(
        normalizedAddress,
        startTime,
        endTime,
      );
      return [...fills].sort((a, b) => b.time - a.time);
    },
    enabled:
      !!readOnlySdk && enabled && !!address && startTime > 0 && endTime > 0,
    staleTime: 1000 * 60, // 1 minute
  });
}

// Get user funding
export function useUserFunding(
  address: string | undefined,
  startTime: number,
  endTime: number,
  enabled: boolean = true,
) {
  const { readOnlySdk } = useHyperliquid();

  return useQuery({
    queryKey: queryKeys.userFunding(address || "", startTime, endTime),
    queryFn: async () => {
      if (!readOnlySdk || !address)
        throw new Error("SDK not initialized or no address");
      const normalizedAddress = address.toLowerCase();
      const data = await readOnlySdk.info.perpetuals.getUserFunding(
        normalizedAddress,
        startTime,
        endTime,
      );
      return [...data].sort((a, b) => b.time - a.time);
    },
    enabled:
      !!readOnlySdk && enabled && !!address && startTime > 0 && endTime > 0,
    staleTime: 1000 * 60, // 1 minute
  });
}
// Get historical orders
export function useHistoricalOrders(
  address: string | undefined,
  enabled: boolean = true,
) {
  const { readOnlySdk } = useHyperliquid();

  return useQuery({
    queryKey: queryKeys.historicalOrders(address || ""),
    queryFn: async () => {
      if (!readOnlySdk || !address)
        throw new Error("SDK not initialized or no address");
      const normalizedAddress = address.toLowerCase();
      return await readOnlySdk.info.getHistoricalOrders(normalizedAddress);
    },
    enabled: !!readOnlySdk && enabled && !!address,
    staleTime: 1000 * 60, // 1 minute - historical data doesn't change often
  });
}

// Get spot meta
export function useSpotMeta(enabled: boolean = true) {
  const { readOnlySdk } = useHyperliquid();

  return useQuery({
    queryKey: queryKeys.spotMeta,
    queryFn: async () => {
      if (!readOnlySdk) throw new Error("SDK not initialized");
      return await readOnlySdk.info.spot.getSpotMeta();
    },
    enabled: !!readOnlySdk && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes - spot tokens don't change often
  });
}

// Hook to invalidate queries after mutations
export function useInvalidateHyperliquidQueries() {
  const queryClient = useQueryClient();
  const { setOpenOrdersData } = useOpenOrdersStore();

  const invalidateAllMids = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.allMids });
  };

  const invalidateClearinghouseState = (address: string) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.clearinghouseState(address),
    });
    // Also force refetch in the store-based hook
    queryClient.invalidateQueries({
      queryKey: ["hyperliquid", "clearinghouseState", address.toLowerCase()],
      refetchType: "active",
    });
  };

  const invalidateSpotClearinghouseState = (address: string) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.spotClearinghouseState(address),
    });
  };

  const invalidateUserOpenOrders = async (address: string) => {
    // Force refetch immediately instead of just invalidating
    await queryClient.refetchQueries({
      queryKey: queryKeys.userOpenOrders(address),
    });

    // Sync updated data to store
    const updatedData = queryClient.getQueryData<any[]>(
      queryKeys.userOpenOrders(address),
    );
    if (updatedData) {
      setOpenOrdersData(updatedData);
    }

    // Also invalidate historical orders to update store
    queryClient.invalidateQueries({
      queryKey: queryKeys.historicalOrders(address),
      refetchType: "active",
    });
  };

  const invalidateUserFills = (address: string) => {
    queryClient.invalidateQueries({
      queryKey: ["hyperliquid", "userFillsByTime", address],
      exact: false,
    });
  };

  const invalidateAll = (address?: string) => {
    queryClient.invalidateQueries({ queryKey: ["hyperliquid"] });
    if (address) {
      invalidateClearinghouseState(address);
      invalidateSpotClearinghouseState(address);
      invalidateUserOpenOrders(address);
      invalidateUserFills(address);
    }
  };

  return {
    invalidateAllMids,
    invalidateClearinghouseState,
    invalidateSpotClearinghouseState,
    invalidateUserOpenOrders,
    invalidateUserFills,
    invalidateAll,
  };
}
