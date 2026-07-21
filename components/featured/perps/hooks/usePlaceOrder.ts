import { useCallback } from "react";
import { useHyperliquid } from "@/contexts/HyperliquidContext";
import { useInvalidateHyperliquidQueries } from "@/hooks/useHyperliquidQueries";
import { useTrading } from "@/hooks/useTrading";
import { getAgentAddress } from "@/utils/getAgentData";
import { useOrderBookStore } from "@/state/orderBook";
import { useMarketDataStore } from "@/state/market";
import { useNotification } from "@/components/shared/NotificationToast";

/**
 * Hook for placing orders on Hyperliquid
 */
export function usePlaceOrder({
  isTrades = false,
  isClose = false,
  isReverse = false,
}: {
  isTrades?: boolean;
  isClose?: boolean;
  isReverse?: boolean;
} = {}) {
  const { getTradingSdk } = useHyperliquid();
  const { invalidateClearinghouseState } = useInvalidateHyperliquidQueries();
  const { form, context } = useTrading();
  const { midPrice } = useOrderBookStore();
  const price = (midPrice ?? 0) * 1.01;
  const { currentSymbolData } = useMarketDataStore();
  const { currentCoin } = useOrderBookStore();
  const { addNotification } = useNotification();
  const handlePlaceOrder = useCallback(
    async (walletAddress: string, isBuy: boolean) => {
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

        let tickSize = 1.0;
        if (form.limitPrice && parseFloat(form.limitPrice) > 0) {
          // Use the string representation to preserve exact decimal places
          const limitPriceStr = form.limitPrice.trim();
          const decimalIndex = limitPriceStr.indexOf(".");
          if (decimalIndex !== -1) {
            const decimalPlaces = limitPriceStr.length - decimalIndex - 1;
            // Use tick size that preserves the exact precision of the entered price
            // Minimum tick size of 0.0001 to handle very small prices like 0.0043
            tickSize = Math.pow(10, -Math.max(decimalPlaces, 4));
          } else {
            // Integer price, use default tick size
            tickSize = 1.0;
          }
        } else {
          // No limit price, calculate from current price
          const priceStr = price.toString();
          const decimalIndex = priceStr.indexOf(".");
          const decimalPlaces =
            decimalIndex !== -1 ? priceStr.length - decimalIndex - 1 : 0;
          tickSize =
            decimalPlaces > 0 ? Math.pow(10, -Math.max(decimalPlaces, 4)) : 1.0;
        }

        const szDecimals = currentSymbolData?.szDecimals || 4;

        if (
          form.orderTab === "limit" &&
          (!form.limitPrice || parseFloat(form.limitPrice) <= 0)
        ) {
          const rawLimitPrice = isBuy ? price * 0.99 : price * 1.01;
          const defaultLimitPrice =
            Math.round(rawLimitPrice / tickSize) * tickSize;
          form.setLimitPrice(String(defaultLimitPrice));
        }

        try {
          await tradingSdk.exchange.noop();
        } catch (noopError) {
          console.warn(
            "Noop action failed (user may already exist):",
            noopError,
          );
        }

        // Update leverage on the exchange to ensure correct leverage is used for the order
        if (!form.reduceOnly && isTrades) {
          try {
            await tradingSdk.exchange.updateLeverage(
              currentSymbolData?.name!,
              context.marginType,
              context.leverage,
            );
          } catch (leverageError) {
            console.warn("Failed to update leverage:", leverageError);
            // Don't throw - continue with order placement as leverage might already be set correctly
          }
        }

        let sizeNum: number;

        // For limit orders, orderSize is always in USDC and we use limitPrice to convert
        if (form.orderTab === "limit") {
          const usdcAmount = parseFloat(form.orderSize);

          const priceToUse = parseFloat(form.limitPrice) || price;
          if (priceToUse <= 0) {
            throw new Error("Please enter a valid limit price");
          }
          // sizeNum = usdcAmount / priceToUse;
          sizeNum = usdcAmount / currentSymbolData!.price;
        } else if (currentCoin === "COIN") {
          // Convert USDC to coin using current market price
          //!IMPORTANT: Uncomment the following line to enable USDC to coin conversion
          // sizeNum = parseFloat(form.orderSize) / price;
          console.log("orderSize1", form.orderSize);

          sizeNum = parseFloat(form.orderSize);
        } else {
          console.log("orderSize", form.orderSize);
          sizeNum = parseFloat(form.orderSize) / currentSymbolData!.price;
        }
        console.log("sizeNum", sizeNum);

        if (isNaN(sizeNum) || sizeNum <= 0) {
          throw new Error("Please enter a valid order size");
        }

        // Round size to szDecimals precision to avoid "floatToWire causes rounding" error
        const sizeMultiplier = Math.pow(10, szDecimals);
        sizeNum = Math.round(sizeNum * sizeMultiplier) / sizeMultiplier;
        sizeNum = Number(sizeNum.toFixed(currentSymbolData?.szDecimals));
        console.log("Final order size after rounding:", sizeNum);
        // Ensure minimum size (0.0001 or equivalent based on szDecimals)
        const minSize = Math.pow(10, -szDecimals);

        let finalLimitPrice: number;
        if (form.orderTab === "market") {
          let slippageMultiplier;
          if (isBuy) {
            slippageMultiplier = 1.08;
          } else {
            slippageMultiplier = 0.92;
          }
          finalLimitPrice = currentSymbolData!.price * slippageMultiplier;
          finalLimitPrice = finalLimitPrice.toFixed(
            currentSymbolData?.decimals || 0,
          ) as unknown as number;
        } else {
          if (form.limitPrice && parseFloat(form.limitPrice) > 0) {
            finalLimitPrice = parseFloat(form.limitPrice);
            finalLimitPrice = Math.round(finalLimitPrice / tickSize) * tickSize;
          } else {
            const rawLimitPrice = isBuy
              ? currentSymbolData!.price * 0.99
              : currentSymbolData!.price * 1.01;
            finalLimitPrice = Math.round(rawLimitPrice / tickSize) * tickSize;
          }
        }
        const tifValue = form.orderTab === "market" ? "FrontendMarket" : "Gtc";

        let orderResult;

        // Check if TP/SL is enabled and build order params accordingly
        if (form.takeProfitStopLoss) {
          if (!form.tpValue && !form.slValue) {
            throw new Error(
              "Please enter at least one Take Profit or Stop Loss value when TP/SL is enabled.",
            );
          }

          const orders = [];

          // Main entry order
          const mainOrder = {
            coin: currentSymbolData?.name,
            is_buy: isBuy,
            sz: sizeNum,
            limit_px: finalLimitPrice,
            order_type: {
              limit: {
                tif: tifValue,
              },
            },
            reduce_only: form.reduceOnly,
          };
          orders.push(mainOrder);

          // Calculate TP/SL prices
          const calculateTpSlPrice = (
            value: string,
            inputType: "price" | "offset",
            isTP: boolean,
          ) => {
            if (!value) return null;

            if (inputType === "price") {
              return parseFloat(value);
            } else {
              // Offset percentage calculation
              const offsetPercent = parseFloat(value) / 100;
              if (isTP) {
                return isBuy
                  ? price * (1 + offsetPercent) // Long TP: price goes up
                  : price * (1 - offsetPercent); // Short TP: price goes down
              } else {
                return isBuy
                  ? price * (1 - offsetPercent) // Long SL: price goes down
                  : price * (1 + offsetPercent); // Short SL: price goes up
              }
            }
          };

          // Take Profit order
          if (form.tpValue) {
            const tpPrice = calculateTpSlPrice(
              form.tpValue,
              form.tpInputType,
              true,
            );
            if (tpPrice && tpPrice > 0) {
              // Validate TP price makes sense for the direction
              const isValidTpPrice = isBuy ? tpPrice > price : tpPrice < price;
              if (!isValidTpPrice) {
                throw new Error(
                  `Invalid Take Profit price. For ${isBuy ? "long" : "short"} positions, TP should be ${isBuy ? "above" : "below"} current price.`,
                );
              }

              const tpOrder = {
                coin: currentSymbolData?.name,
                is_buy: !isBuy, // Opposite direction to close position
                sz: sizeNum,
                limit_px: Math.round(tpPrice / tickSize) * tickSize,
                order_type: {
                  trigger: {
                    isMarket: true,
                    tpsl: "tp" as const,
                    triggerPx: Math.round(tpPrice / tickSize) * tickSize,
                  },
                },
                reduce_only: true,
              };
              orders.push(tpOrder);
            }
          }

          // Stop Loss order
          if (form.slValue) {
            const slPrice = calculateTpSlPrice(
              form.slValue,
              form.slInputType,
              false,
            );
            if (slPrice && slPrice > 0) {
              // Validate SL price makes sense for the direction
              const isValidSlPrice = isBuy ? slPrice < price : slPrice > price;
              if (!isValidSlPrice) {
                throw new Error(
                  `Invalid Stop Loss price. For ${isBuy ? "long" : "short"} positions, SL should be ${isBuy ? "below" : "above"} current price.`,
                );
              }

              const slOrder = {
                coin: currentSymbolData?.name,
                is_buy: !isBuy, // Opposite direction to close position
                sz: sizeNum,
                limit_px: Math.round(slPrice / tickSize) * tickSize,
                order_type: {
                  trigger: {
                    isMarket: true,
                    tpsl: "sl" as const,
                    triggerPx: Math.round(slPrice / tickSize) * tickSize,
                  },
                },
                reduce_only: true,
              };
              orders.push(slOrder);
            }
          }

          const bulkOrderParams = {
            orders,
            grouping: "normalTpsl" as const,
          };

          orderResult = await tradingSdk.exchange.placeOrder(
            bulkOrderParams as Parameters<
              typeof tradingSdk.exchange.placeOrder
            >[0],
          );
        } else {
          // Single order without TP/SL
          const orderParams = {
            coin: currentSymbolData?.name,
            is_buy: isBuy,
            sz: sizeNum,
            limit_px: finalLimitPrice,
            order_type: {
              limit: {
                tif: tifValue,
              },
            },
            reduce_only: form.reduceOnly,
          };
          orderResult = await tradingSdk.exchange.placeOrder(
            orderParams as Parameters<typeof tradingSdk.exchange.placeOrder>[0],
          );
        }

        if (orderResult.status === "err") {
          const errorMsg = orderResult.response || "Failed to place order";
          if (errorMsg.includes("does not exist")) {
            throw new Error(
              "Trading failed. Please check your balance and try again.",
            );
          }
          throw new Error(errorMsg);
        }

        // Handle successful response but with order errors
        if (
          orderResult.status === "ok" &&
          orderResult.response?.data?.statuses
        ) {
          const statuses = orderResult.response.data.statuses;
          const errorStatus = statuses.find((status: any) => status.error);

          if (errorStatus?.error) {
            const errorMsg = errorStatus.error;
            if (
              errorMsg.includes(
                "Post only order would have immediately matched",
              )
            ) {
              throw new Error(
                "Post-only order rejected: Your limit price would execute immediately. Adjust your price to avoid immediate execution or use a different order type.",
              );
            }
            throw new Error(errorMsg);
          }
        }

        const hasTPSL =
          form.takeProfitStopLoss && (form.tpValue || form.slValue);
        const tpSlMsg = hasTPSL
          ? ` with ${form.tpValue ? "TP" : ""}${form.tpValue && form.slValue ? "/" : ""}${form.slValue ? "SL" : ""}`
          : "";

        context.setStatus({
          type: "success",
          message: `${isBuy ? "Long" : "Short"} order${tpSlMsg} placed successfully!`,
        });

        // Add notification with order details
        if (isTrades) {
          addNotification({
            type: "success",
            title: "Order submitted",
            message: `${isBuy ? "Long" : "Short"} ${sizeNum} ${currentSymbolData?.name}`,
          });
        } else if (isClose) {
          addNotification({
            type: "success",
            title: "Close successfully",
          });
        } else if (isReverse) {
          addNotification({
            type: "success",
            title: "Reverse successfully",
          });
        }

        // Invalidate queries to refresh data
        if (walletAddress) {
          invalidateClearinghouseState(walletAddress);
        }
      } catch (error: unknown) {
        console.error("Error placing order:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to place order. Please check your balance and try again.";
        context.setStatus({
          type: "error",
          message: errorMessage,
        });
        // Add error notification with only title
        addNotification({
          type: "error",
          title: errorMessage,
        });
        throw new Error("Error placing order:", error as any);
      } finally {
        context.setIsLoading(false);
      }
    },
    [
      currentSymbolData?.name,
      price,
      getTradingSdk,
      invalidateClearinghouseState,
      form,
      context,
    ],
  );

  return { handlePlaceOrder };
}
