import { Hyperliquid } from "packages/hyperliquid/src";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { getAgentData } from "utils/getAgentData";
import { fetchTokenImages } from "utils/fetchTokenImages";

export const TESTNET = true;

interface L2BookResponse {
  coin: string;
  levels: [
    Array<{ px: string; sz: string; n: number }>,
    Array<{ px: string; sz: string; n: number }>,
  ];
}

interface RecentTrade {
  coin: string;
  side: string;
  px: string;
  sz: string;
  hash: string;
  time: number;
  tid: number;
}

interface RecentTradesResponse extends Array<RecentTrade> {}

interface HyperliquidContextType {
  readOnlySdk: Hyperliquid | null;
  getTradingSdk: (
    privateKey: string,
    walletAddress: string,
  ) => Promise<Hyperliquid>;
  isLoading: boolean;
  isReadOnlyReady: boolean;
  isAgentReady: boolean;
  error: string | null;
  tokenImages: { symbol: string; name: string; image: string }[];
  sdkWithAgent: Hyperliquid | null;
}

const HyperliquidContext = createContext<HyperliquidContextType | undefined>(
  undefined,
);

interface HyperliquidProviderProps {
  children: ReactNode;
  walletAddress?: string;
}

const readOnlySdkRaw = new Hyperliquid({
  testnet: TESTNET,
  enableWs: true,
  disableAssetMapRefresh: true,
  assetMapRefreshIntervalMs: Infinity,
  disableAutoReferral: true,
});
readOnlySdkRaw.connect();

export function HyperliquidProvider({
  children,
  walletAddress,
}: HyperliquidProviderProps) {
  const [readOnlySdk] = useState<Hyperliquid | null>(readOnlySdkRaw);
  const [sdkWithAgent, setSdkWithAgent] = useState<Hyperliquid | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Only for agent SDK
  const [isReadOnlyReady, setIsReadOnlyReady] = useState(true);
  const [isAgentReady, setIsAgentReady] = useState(false);
  const [tokenImages, setTokenImages] = useState<
    { symbol: string; name: string; image: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const cacheKey = "tokenImagesCache";

    // Load from cache immediately (synchronous)
    try {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.data)) {
          setTokenImages(parsed.data);
        }
      }
    } catch {
      console.error("Failed to read token images from cache");
    }

    const fetchTokenImagesData = async () => {
      try {
        const cachedImage = localStorage.getItem(cacheKey);
        if (cachedImage) {
          const parsed = JSON.parse(cachedImage);
          if (parsed && Array.isArray(parsed)) {
            setTokenImages(parsed);
            return;
          }
        }

        const data = await fetchTokenImages();

        const filtered = Array.isArray(data)
          ? data.map(
              (item: { symbol: string; name: string; image: string }) => ({
                symbol: item.symbol,
                name: item.name,
                image: item.image,
              }),
            )
          : [];
        setTokenImages(filtered);
        try {
          window.localStorage.setItem(cacheKey, JSON.stringify(filtered));
        } catch {
          console.error("Failed to cache token images");
        }
      } catch (e) {
        console.error("Failed to load token images", e);
      }
    };

    // Use setTimeout to ensure this doesn't block initial render
    setTimeout(fetchTokenImagesData, 0);
  }, []);

  const tradeInit = useRef<string | null>(null);

  // useEffect(() => {
  //   if (typeof window === "undefined") return;

  //   const initializeReadOnlySdk = async () => {
  //     try {
  //       const sdk = new Hyperliquid({
  //         testnet: TESTNET,
  //         enableWs: true,
  //         disableAssetMapRefresh: true,
  //       });

  //       // Set SDK immediately for non-blocking usage - AGGRESSIVE OPTIMIZATION
  //       setReadOnlySdk(sdk);
  //       setIsReadOnlyReady(true); // Mark as ready immediately for faster queries

  //       // Initialize in background - don't wait for it
  //       Promise.race([
  //         sdk.connect().then(() => sdk.ensureInitialized()),
  //         new Promise((_, reject) =>
  //           setTimeout(() => reject(new Error("SDK init timeout")), 5000),
  //         ),
  //       ])
  //         .then(() => {
  //           console.log("Read-only SDK initialized successfully (background)");
  //         })
  //         .catch((err) => {
  //           console.warn("SDK initialization failed/timed out:", err);
  //           // Keep SDK ready anyway - many operations work without full init
  //         });
  //     } catch (err) {
  //       console.error("Error creating read-only SDK:", err);
  //       setError(
  //         err instanceof Error ? err.message : "Failed to create read-only SDK",
  //       );
  //     }
  //   };

  //   initializeReadOnlySdk();
  // }, []);

  useEffect(() => {
    if (!walletAddress) {
      setIsLoading(false);
      setIsAgentReady(false);
      return;
    }

    let isMounted = true;

    const initializeAgentSdk = async (walletAddressConnected: string) => {
      try {
        if (!walletAddressConnected) return;
        if (tradeInit.current === walletAddressConnected) {
          // Already initialized for this wallet address
          setIsAgentReady(true);
          return;
        }

        setIsLoading(true);
        setIsAgentReady(false);
        setError(null);

        const agentWalletData = getAgentData(walletAddressConnected);

        if (!agentWalletData) {
          setIsLoading(false);
          return;
        }

        const sdk = new Hyperliquid({
          privateKey: agentWalletData?.privateKey,
          testnet: TESTNET,
          enableWs: true,
          walletAddress: agentWalletData?.address,
          disableAssetMapRefresh: true,
          assetMapRefreshIntervalMs: Infinity,
          disableAutoReferral: true,
        });

        // Set SDK immediately for non-blocking usage
        setSdkWithAgent(sdk);
        tradeInit.current = walletAddressConnected;

        // Initialize in background
        sdk
          .connect()
          .then(() => {
            if (isMounted) {
              setIsAgentReady(true);
              setIsLoading(false);
              console.log("Agent SDK initialized successfully");
            }
          })
          .catch((err) => {
            console.warn(
              "Agent SDK initialization delayed, but basic operations may still work:",
              err,
            );
            if (isMounted) {
              // Don't set error immediately - allow partial functionality
              setIsLoading(false);
              setTimeout(() => {
                setIsAgentReady(true);
                console.log(
                  "Agent SDK marked as ready (partial initialization)",
                );
              }, 2000);
            }
          });
      } catch (err) {
        console.error("Error creating agent SDK:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to create agent SDK",
          );
          setIsLoading(false);
        }
      }
    };

    initializeAgentSdk(walletAddress);

    return () => {
      isMounted = false;
      // Cleanup agent SDK on unmount
      if (sdkWithAgent) {
        // SDK cleanup is handled internally
      }
    };
  }, [walletAddress]);

  // Get or create trading SDK for a specific privateKey
  // @deprecated privateKey is no longer used to get trading SDKs
  // @deprecated use walletAddress
  const getTradingSdk = async (
    privateKey?: string,
    walletAddress?: string,
  ): Promise<Hyperliquid> => {
    return sdkWithAgent as Hyperliquid;
  };

  return (
    <HyperliquidContext.Provider
      value={{
        readOnlySdk,
        getTradingSdk,
        isLoading,
        isReadOnlyReady,
        isAgentReady,
        error,
        tokenImages,
        sdkWithAgent,
      }}
    >
      {children}
    </HyperliquidContext.Provider>
  );
}

export function useHyperliquid() {
  const context = useContext(HyperliquidContext);
  if (context === undefined) {
    throw new Error("useHyperliquid must be used within a HyperliquidProvider");
  }
  return context;
}
