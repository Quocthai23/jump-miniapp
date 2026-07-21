import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/contexts/HyperliquidContext";
import {
  useClearinghouseStore,
  type ClearinghouseData,
} from "@/state/clearinghouseStore";

export interface UseClearinghouseWithStoreReturn {
  data: ClearinghouseData | null;
  isLoading: boolean;
  error: Error | string | null;
  isStale: boolean;
  refetch: () => void;
  clearAddress: (addr: string) => void;
  shouldRefetch: (staleTime?: number) => boolean;
}

export interface UseClearinghouseStoreOnlyReturn {
  data: ClearinghouseData | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to access cached clearinghouse data from Zustand store only
 * Does not trigger any network requests - useful for components that just need to read cached data
 */
export function useClearinghouseStoreOnly(
  address: string | undefined,
): UseClearinghouseStoreOnlyReturn {
  const store = useClearinghouseStore();
  const normalizedAddress = address?.toLowerCase() || "";

  if (!normalizedAddress) {
    return {
      data: null,
      isLoading: false,
      error: null,
    };
  }

  return {
    data: store.getData(normalizedAddress),
    isLoading: store.getIsLoading(normalizedAddress),
    error: store.getError(normalizedAddress),
  };
}

/**
 * Custom hook that combines Zustand store with React Query for clearinghouse state
 * Provides automatic refetching while storing data in Zustand for global access
 */
export function useClearinghouseWithStore(
  address: string | undefined,
  enabled: boolean = true,
): UseClearinghouseWithStoreReturn {
  const { readOnlySdk } = useHyperliquid();
  const store = useClearinghouseStore();

  const normalizedAddress = address?.toLowerCase() || "";

  // React Query for automatic refetching and network state management
  const query = useQuery({
    queryKey: ["hyperliquid", "clearinghouseState", normalizedAddress],
    queryFn: async () => {
      if (!readOnlySdk || !normalizedAddress) {
        throw new Error("SDK not initialized or no address");
      }
      store.setLoading(normalizedAddress, true);

      try {
        const data =
          await readOnlySdk.info.perpetuals.getClearinghouseState(
            normalizedAddress,
          );
        store.setData(normalizedAddress, data);
        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        store.setError(normalizedAddress, errorMessage);
        throw error;
      } finally {
        store.setLoading(normalizedAddress, false);
      }
    },
    enabled: !!readOnlySdk && enabled && !!normalizedAddress,
    staleTime: 1000 * 30, // 30 seconds - balances change frequently
    refetchInterval: 1000 * 60, // Refetch every 60 seconds
    // Don't show loading state for background refetches
    notifyOnChangeProps: ["data", "error"],
  });

  // Sync loading state when query starts
  useEffect(() => {
    if (query.isFetching && normalizedAddress) {
      store.setLoading(normalizedAddress, true);
    } else if (!query.isFetching && normalizedAddress) {
      store.setLoading(normalizedAddress, false);
    }
  }, [query.isFetching, normalizedAddress, store]);

  // Get current data from store
  const storeData = normalizedAddress ? store.getData(normalizedAddress) : null;
  const storeIsLoading = normalizedAddress
    ? store.getIsLoading(normalizedAddress)
    : false;
  const storeError = normalizedAddress
    ? store.getError(normalizedAddress)
    : null;

  return {
    data: storeData || query.data || null,
    isLoading: storeIsLoading || query.isLoading,
    error: storeError || query.error,
    isStale: query.isStale,
    refetch: query.refetch,
    // Additional store methods for advanced use cases
    clearAddress: (addr: string) => store.clearAddress(addr),
    shouldRefetch: (staleTime?: number) =>
      normalizedAddress
        ? store.shouldRefetch(normalizedAddress, staleTime)
        : false,
  };
}
