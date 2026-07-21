import { useHyperliquid } from "@/contexts/HyperliquidContext";
import { useEffect, useMemo, useRef } from "react";
import { useAccount } from "wagmi";
import { getAgentAddress } from "../utils/getAgentData";
import useUserStore from "@/state/user";
import {
  getMarketData,
  type MarketData,
  useMarketDataStore,
} from "@/state/market/marketDataStore";
import { useOrderBookStore } from "@/state/orderBook";
import {
  useMetaAndAssetCtxs,
  useUserFillsByTime,
} from "./useHyperliquidQueries";
import { useTradeHistoryStore, useTradingContextStore } from "@/state/trading";
import { useClearinghouseStore } from "@/state/clearinghouseStore";
import { usePendingPositionsStore } from "@/state/pendingPositionsStore";
import type {
  AllMids,
  WebData2,
  WsActiveAssetCtx,
} from "@/packages/hyperliquid/src";
import type { WsBook, OrderBook } from "@/state/orderBook";

export const useGlobal = () => {
  const { readOnlySdk } = useHyperliquid();
  const { data: metaData } = useMetaAndAssetCtxs();
  const { address } = useAccount();
  const {
    setMarketData,
    setIsLoading,
    updatePartialCurrentSymbolData,
    updateMarketPriceBySymbol,
  } = useMarketDataStore();
  const { selectedCoin } = useTradingContextStore();
  const { setAssetPositions } = useClearinghouseStore();
  const setEnableTrading = useUserStore((state) => state.setEnableTrading);
  const isEnableTrading = useUserStore((state) => state.isEnableTrading);
  const {
    setOrderbook,
    setMidPrice,
    setIsConnecting,
    setConnectionError,
    setClickedPrice,
    setOrderbooksData,
  } = useOrderBookStore();
  const { setPendingPositions } = usePendingPositionsStore();
  const { address: walletAddress } = useAccount();
  const {
    tradeHistory: storedTradeHistory,
    fundingHistory: storedFundingHistory,
    orderHistory: storedOrderHistory,
    twapFills: storedTwapFills,
    setTradeHistory,
    setFundingHistory,
    setOrderHistory,
    setTwapFills,
    setLoadingTradeHistory,
    setLoadingFundingHistory,
    setLoadingOrderHistory,
    setLoadingTwap,
    setTradeHistoryError,
    updateTimeRange,
    getFilteredTradeHistory,
    getFilteredFundingHistory,
    getFilteredOrderHistory,
    getFilteredTwapFills,
  } = useTradeHistoryStore();
  const currentSymbolWatched = useRef<string | null>(null);
  const subscribedCoinRef = useRef<string | null>(null);
  const initializedRef = useRef(false);
  const previousAddressRef = useRef<string | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const DEFAULT_ADDRESS = "0x4DB9335A7535D1426f7f37802802C607220B183C";
  const timeRange = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    return { now, sevenDaysAgo };
  }, []);
  const {
    data: tradeHistoryData,
    isLoading: isLoadingTradeHistory,
    error: tradeHistoryError,
  } = useUserFillsByTime(walletAddress, timeRange.sevenDaysAgo, timeRange.now);
  useEffect(() => {
    if (tradeHistoryData) {
      setTradeHistory(tradeHistoryData);
    }
    setLoadingTradeHistory(isLoadingTradeHistory);
    setTradeHistoryError(tradeHistoryError ? tradeHistoryError.message : null);
  }, [tradeHistoryData, isLoadingTradeHistory, tradeHistoryError]);
  useEffect(() => {
    if (!metaData || initializedRef.current) return;

    const isHydrated = useMarketDataStore.getState().isHydrated;
    const currentMarketData = getMarketData();

    // Only initialize if store is empty AND not yet hydrated from server
    if (
      (!currentMarketData || currentMarketData.length === 0) &&
      !isHydrated &&
      metaData[0].name.includes("SOL")
    ) {
      setMarketData(metaData);
      initializedRef.current = true;
    }
  }, [metaData, setMarketData]);

  useEffect(() => {
    if (!readOnlySdk) return;
    const currentAddress = address || DEFAULT_ADDRESS;

    // Unsubscribe from previous address before subscribing to new one
    const unsubscribePrevious = async () => {
      if (
        previousAddressRef.current &&
        previousAddressRef.current !== currentAddress
      ) {
        try {
          await readOnlySdk.subscriptions.unsubscribeFromWebData2(
            previousAddressRef.current,
          );
        } catch (error) {
          console.warn("Failed to unsubscribe from previous address:", error);
        }
      }
    };

    const handleWeb3Data = async () => {
      try {
        await unsubscribePrevious();
        previousAddressRef.current = currentAddress;

        await readOnlySdk.subscriptions.subscribeToWebData2(
          currentAddress,
          (data: WebData2) => {
            const currentMarketData = getMarketData();
            const { assetCtxs } = data;
            if (data?.clearinghouseState?.assetPositions) {
              setAssetPositions(data.clearinghouseState.assetPositions);
            }
            if (assetCtxs.length && currentMarketData?.length) {
              const newMarketData = currentMarketData.map((market, index) => {
                const matchingAssetCtx = assetCtxs[index];
                if (matchingAssetCtx && matchingAssetCtx.markPx) {
                  const change24h =
                    ((parseFloat(matchingAssetCtx.markPx) -
                      parseFloat(matchingAssetCtx.prevDayPx)) /
                      parseFloat(matchingAssetCtx.prevDayPx)) *
                    100;

                  return {
                    ...market,
                    price: parseFloat(matchingAssetCtx.markPx),
                    change24h: change24h,
                    openInterest: parseFloat(matchingAssetCtx.openInterest),
                    prevPrice: parseFloat(matchingAssetCtx.prevDayPx),
                    volume24h: parseFloat(matchingAssetCtx.dayNtlVlm),
                    oraclePx: parseFloat(matchingAssetCtx.oraclePx),
                    volumeBase24h: parseFloat(
                      matchingAssetCtx.dayBaseVlm?.toString() || "0",
                    ),
                    funding: parseFloat(matchingAssetCtx.funding),
                  };
                }
                return market;
              });
              setMarketData(newMarketData);
            }

            setIsLoading(false);
            if (address && address !== DEFAULT_ADDRESS) {
              const currentAgentData = getAgentAddress(address);
              if (currentAgentData) {
                if (data?.user?.toLowerCase() === address?.toLowerCase()) {
                  if (
                    data.agentAddress?.toLowerCase() ===
                      currentAgentData.address.toLowerCase() &&
                    !isEnableTrading
                  ) {
                    setEnableTrading(true);
                  } else if (isEnableTrading) {
                    setEnableTrading(false);
                  }
                }
              }
            }
          },
        );
      } catch (error) {
        console.error("Failed to subscribe to WebData2:", error);
        const retryTimer = setTimeout(() => {
          handleWeb3Data();
        }, 1000);
        return () => clearTimeout(retryTimer);
      }
    };

    handleWeb3Data();

    // return () => {
    //   readOnlySdk.subscriptions
    //     .unsubscribeFromWebData2(currentAddress)
    //     .catch(() => {});
    // };
  }, [
    address,
    readOnlySdk,
    setEnableTrading,
    setMarketData,
    setIsLoading,
    setAssetPositions,
  ]);

  useEffect(() => {
    const initSymbol = selectedCoin?.includes("-PERP")
      ? selectedCoin.replaceAll("-PERP", "")
      : selectedCoin;
    if (
      !!readOnlySdk &&
      initSymbol &&
      currentSymbolWatched.current !== initSymbol
    ) {
      const handleWatchAsset = async () => {
        try {
          readOnlySdk.subscriptions.subscribeToActiveAssetCtx(
            initSymbol,
            (data: WsActiveAssetCtx) => {
              const { ctx } = data;
              if (ctx) {
                const newData: Partial<MarketData> = {
                  price: parseFloat(ctx?.markPx),
                  change24h:
                    ((parseFloat(ctx?.markPx) - parseFloat(ctx?.prevDayPx)) /
                      parseFloat(ctx?.prevDayPx)) *
                    100,
                  openInterest:
                    parseFloat(ctx?.openInterest as any) *
                    parseFloat(ctx?.markPx as any),
                  prevPrice: parseFloat(ctx?.prevDayPx),
                  volume24h: parseFloat(ctx?.dayNtlVlm),
                  oraclePx: ctx?.oraclePx,
                  funding: ctx?.funding,
                };

                updatePartialCurrentSymbolData(newData);
              }
            },
          );
        } catch (error) {
          console.error("Failed to subscribe to WsActiveAssetCtx:", error);
          const retryTimer = setTimeout(() => {
            handleWatchAsset();
          }, 1000);
          return () => clearTimeout(retryTimer);
        }
      };

      if (currentSymbolWatched.current) {
        // Unsubscribe previous symbol
        try {
          readOnlySdk.subscriptions
            .unsubscribeFromActiveAssetCtx(currentSymbolWatched.current)
            .catch(() => {});
        } catch (error) {}
      }

      currentSymbolWatched.current = initSymbol;
      handleWatchAsset();
    }
  }, [readOnlySdk, selectedCoin, updatePartialCurrentSymbolData]);

  useEffect(() => {
    if (!readOnlySdk) return;

    const handleAllMids = async () => {
      try {
        await readOnlySdk.subscriptions.subscribeToAllMids((data: AllMids) => {
          const currentMarketData = getMarketData();
          if (!currentMarketData) return;

          // Update prices for all markets
          Object.entries(data).forEach(([coin, priceStr]) => {
            const price = parseFloat(priceStr);
            if (!isNaN(price)) {
              // updateMarketPriceBySymbol handles both symbol (without -PERP) and name (with -PERP)
              const symbol = coin.replace("-PERP", "").toUpperCase();
              updateMarketPriceBySymbol(symbol, price);
            }
          });
        });
      } catch (error) {
        console.error("Failed to subscribe to AllMids:", error);
        const retryTimer = setTimeout(() => {
          handleAllMids();
        }, 1000);
        return () => clearTimeout(retryTimer);
      }
    };

    handleAllMids();

    // Cleanup
    return () => {
      readOnlySdk.subscriptions.unsubscribeFromAllMids().catch(() => {});
    };
  }, [readOnlySdk, updateMarketPriceBySymbol]);

  useEffect(() => {
    if (!readOnlySdk || !selectedCoin) return;

    const coinSymbol = selectedCoin.includes("-USDC")
      ? selectedCoin.replace("-USDC", "-PERP")
      : selectedCoin;

    if (subscribedCoinRef.current === coinSymbol) {
      return;
    }

    let isMounted = true;
    setConnectionError(null);

    const subscribe = async () => {
      try {
        const waitForConnection = async () => {
          if (
            readOnlySdk.isWebSocketEnabled &&
            readOnlySdk.isWebSocketEnabled()
          ) {
            if (!readOnlySdk.isWebSocketConnected()) {
              let attempts = 0;
              while (
                !readOnlySdk.isWebSocketConnected() &&
                attempts < 20 &&
                isMounted
              ) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                attempts++;
              }
            }
          }
          return true;
        };

        await waitForConnection();

        // Unsubscribe from previous coin
        if (subscribedCoinRef.current && readOnlySdk.subscriptions) {
          try {
            await readOnlySdk.subscriptions
              .unsubscribeFromL2Book(subscribedCoinRef.current)
              .catch(() => {});
            await readOnlySdk.subscriptions
              .unsubscribeFromTrades(subscribedCoinRef.current)
              .catch(() => {});
          } catch (e) {
            console.warn("Error unsubscribing from previous coin:", e);
          }
        }

        if (isMounted) {
          setOrderbook(null);
        }

        // Define callbacks for incoming data
        const orderbookCallback = (data: WsBook) => {
          if (!isMounted) return;

          // Extract bid and ask prices from levels
          const bidPrice = parseFloat(data.levels[0]?.[0]?.px || "0");
          const askPrice = parseFloat(data.levels[1]?.[0]?.px || "0");

          // Create orderbook with only prices
          const orderbook: OrderBook = {
            bidPrice,
            askPrice,
          };
          setOrderbook(orderbook);
          setOrderbooksData(data.levels);
          // Calculate and update mid price
          const midPrice = (bidPrice + askPrice) / 2;
          setMidPrice(midPrice);

          if (bidPrice) {
            setClickedPrice(bidPrice.toString());
          }
        };

        if (readOnlySdk.subscriptions) {
          try {
            await readOnlySdk.subscriptions
              .subscribeToL2Book(coinSymbol, orderbookCallback)
              .then(() => {
                if (isMounted) {
                  setConnectionError(null);
                }
              })
              .catch((err: any) => {
                if (isMounted) {
                  setConnectionError(
                    `Failed to subscribe to orderbook: ${err.message}`,
                  );
                }
              });

            if (isMounted) {
              subscribedCoinRef.current = coinSymbol;
            }
          } catch (syncError) {
            if (isMounted) {
              setConnectionError(
                `Subscription error: ${
                  syncError instanceof Error
                    ? syncError.message
                    : "Unknown error"
                }`,
              );
            }
          }
        } else {
          retryTimeoutRef.current = setTimeout(() => {
            if (isMounted && readOnlySdk.subscriptions) {
              subscribe();
            }
          }, 1000);
        }
      } catch (error) {
        console.error("Error subscribing to coin:", error);
        if (isMounted) {
          subscribedCoinRef.current = null;
          setConnectionError(
            `Connection failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          );
        }
      }
    };

    subscribe();

    // Fetch initial order book via REST API
    const fetchOrderbook = async () => {
      try {
        setIsConnecting(true);
        const data = await readOnlySdk.info.getL2Book(coinSymbol);
        if (isMounted) {
          // Extract bid and ask prices
          const bidPrice = parseFloat(data.levels[0]?.[0]?.px || "0");
          const askPrice = parseFloat(data.levels[1]?.[0]?.px || "0");

          const orderbook: OrderBook = {
            bidPrice,
            askPrice,
          };
          setOrderbook(orderbook);

          // Auto-set clicked price to bid price
          if (bidPrice) {
            setClickedPrice(bidPrice.toString());
          }

          setIsConnecting(false);
        }
      } catch (error) {
        if (isMounted) {
          setIsConnecting(false);
          console.warn("Failed to fetch initial orderbook via SDK:", error);
        }
      }
    };

    if (coinSymbol.includes("-PERP")) {
      fetchOrderbook();
    }

    // Cleanup function
    return () => {
      isMounted = false;

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      // Unsubscribe from current feeds
      if (readOnlySdk?.subscriptions && subscribedCoinRef.current) {
        readOnlySdk.subscriptions
          .unsubscribeFromL2Book(subscribedCoinRef.current)
          .catch(() => {});
        readOnlySdk.subscriptions
          .unsubscribeFromTrades(subscribedCoinRef.current)
          .catch(() => {});
        subscribedCoinRef.current = null;
      }
    };
  }, [
    readOnlySdk,
    selectedCoin,
    setOrderbook,
    setMidPrice,
    setConnectionError,
    setIsConnecting,
    setClickedPrice,
  ]);

};
