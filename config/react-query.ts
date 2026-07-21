import { QueryClient } from "@tanstack/react-query";

let queryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 30, // 30 seconds - data is fresh for 30s
          gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
          refetchOnWindowFocus: false,
          refetchOnMount: true,
          retry: 1,
          retryDelay: 1000,
        },
      },
    });
  }
  return queryClient;
}
