import { ChevronLeft, ChevronDown, Info } from "lucide-react";
import { memo, useMemo, useState, useEffect, useCallback } from "react";
import { useMarketDataStore } from "@/state/market/marketDataStore";
import { useHydratedTradingStore } from "@/hooks/useHydratedTradingStore";
import { useTradingContextStore } from "@/state/trading/tradingContextStore";
import { formatPrice } from "@/utils/price";
import { getTextStatusColor } from "@/utils/color";
import { OrderTypeModal } from "@/components/shared/OrderTypeModal";
import { useOrderFormStore } from "@/state/trading/orderFormStore";
import { InfoModal } from "@/components/shared/InfoModal";
import { LimitModal } from "@/components/shared/LimitModal";
import { CustomSwitch } from "./CustomSwitch";
import { LeverageModal } from "./LeverageModal";
import { AutoCloseModal } from "./AutoCloseModal";
import { OrderButton } from "./components/trading/OrderButton";
import useUserStore from "@/state/user";
import { useTrading } from "@/hooks/useTrading";
import { useEnableTrading, usePlaceOrder } from "./hooks";
import { useAccount } from "wagmi";
import {
  useClearinghouseState,
  useInvalidateHyperliquidQueries,
  useUserOpenOrders,
} from "@/hooks/useHyperliquidQueries";
import { useOrderBookStore } from "@/state/orderBook";
import { useClearinghouseStore } from "@/state/clearinghouseStore";
import { useNotification } from "@/components/shared/NotificationToast";
import { useUserFees } from "@/hooks/useUserFees";
interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIncrease?: boolean;
}
interface InfoModalData {
  title: string;
  description: string;
}

const TradeInputSection = memo(
  ({
    markPrice,
    onChange,
  }: {
    markPrice: string | number;
    onChange: (usdc: string) => void;
  }) => {
    const { userFees, makerPercentage, takerPercentage, refetch } =
      useUserFees();

    const [isFocused, setIsFocused] = useState(false);
    const { orderSize, setOrderSize } = useOrderFormStore();
    const [sliderPercentage, setSliderPercentage] = useState(0);
    const { leverage } = useTradingContextStore();
    const { currentSymbolData } = useMarketDataStore();
    const { isLoading, perpsBalance } = useTradingContextStore();
    const { setSizePercent } = useOrderFormStore();
    const { midPrice, orderbooksData } = useOrderBookStore();

    const balance = perpsBalance
      ? parseFloat(perpsBalance.replace(/[^0-9.]/g, ""))
      : 0;

    const formatCoinAmount = (value: number) => {
      return value.toFixed(2);
    };
    // Calculate size from percentage
    // const calculateSizeFromPercentage = (percent: number) => {
    //   const feeRate = takerPercentage; // vd: 0.000432
    //   const slippage = 0.000093;       // lấy từ UI
    //   const safetyBuffer = 0.015;
    //   const SAFE_RATIO = 1 - feeRate/100;
    //   const size =
    //     balance *
    //     (percent / 100) *
    //     SAFE_RATIO;

    //   return formatCoinAmount(size*leverage);
    // };
    function estimateSlippage(
      sizeUSDC: number,
      levels: { px: number; sz: number }[],
      midPrice: number,
    ) {
      let remain = sizeUSDC / midPrice;
      let cost = 0;

      for (const l of levels) {
        const price = l.px;
        const avail = l.sz;

        const take = Math.min(remain, avail);
        cost += take * price;
        remain -= take;

        if (remain <= 0) break;
      }

      if (remain > 0) return Infinity;

      const avgPrice = cost / (sizeUSDC / midPrice);
      return (avgPrice - midPrice) / midPrice;
    }

    const calculateSizeFromPercentage = (percent: number) => {
      const bids = orderbooksData[0];
      const asks = orderbooksData[1];

      const feeRate = takerPercentage ?? 0;
      const safetyBuffer = 0.01;

      const rawSize = balance * (percent / 100);

      const slippage = estimateSlippage(rawSize, asks, midPrice);
      const SAFE_RATIO = 1 - feeRate / 100 - slippage / 100;
      const finalSize = rawSize * SAFE_RATIO;

      return formatCoinAmount(finalSize * leverage);
    };
    // Handle slider change
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setSliderPercentage(value);
      const newSize = calculateSizeFromPercentage(value);
      setOrderSize(newSize);
      onChange(newSize);
      setSizePercent(value);
    };

    // Handle percentage button clicks
    const handlePercentageClick = (percent: number) => {
      setSliderPercentage(percent);
      const newSize = calculateSizeFromPercentage(percent);
      setOrderSize(newSize);
      onChange(newSize);
      setSizePercent(percent);
    };

    // Handle number input change
    const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      if (value === "") {
        setOrderSize("");
        setSliderPercentage(0);
        setSizePercent(0);
        return;
      }
      // Allow decimal patterns
      if (!/^\d*\.?\d*$/.test(value)) return;

      setOrderSize(value);
      setIsFocused(true);
      onChange(value);

      // Update slider: calculate percentage from size
      const numericValue = parseFloat(value);
      const percent = (numericValue / (balance * leverage)) * 100;
      const boundedPercent = Math.min(percent, 100);
      setSliderPercentage(boundedPercent);
      setSizePercent(boundedPercent);
    };

    // On blur, format the value
    const handleSizeBlur = () => {
      setIsFocused(false);
      if (orderSize && orderSize !== "") {
        const numValue = parseFloat(orderSize);
        if (!isNaN(numValue) && numValue > 0) {
          const formatted = formatCoinAmount(numValue);
          setOrderSize(formatted);
          onChange(formatted);
        }
      }
    };

    // Slider background gradient style
    const sliderStyle = useMemo(
      () => ({
        background: `linear-gradient(to right, #10B981 0%, #10B981 ${sliderPercentage}%, #e5e7eb ${sliderPercentage}%, #e5e7eb 100%)`,
      }),
      [sliderPercentage],
    );

    // Recalculate order size when orderbook changes
    useEffect(() => {
      if (sliderPercentage > 0) {
        const newSize = calculateSizeFromPercentage(sliderPercentage);
        setOrderSize(newSize);
        onChange(newSize);
      }
    }, [orderbooksData, midPrice]);

    return (
      <div className="mb-6 shrink-0 flex flex-col">
        {/* Price Input */}
        <div className="text-center mb-10">
          <div className="flex items-baseline justify-center gap-1 mb-4 w-full">
            <span className="display-lg text-gray-900 w-[35%] text-right">
              $
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={orderSize != "NaN" ? orderSize : ""}
              onChange={handleSizeChange}
              onBlur={handleSizeBlur}
              className="display-lg flex-1 bg-transparent text-gray-900 outline-none transition-colors w-48"
              placeholder="0"
              disabled={isLoading}
            />
          </div>
          <div className="text-gray-500 text-sm font-medium">
            {orderSize &&
            markPrice &&
            !isNaN(Number(orderSize)) &&
            !isNaN(Number(markPrice))
              ? (Number(orderSize) / Number(markPrice)).toFixed(
                  currentSymbolData?.szDecimals,
                )
              : Number(0).toFixed(currentSymbolData?.szDecimals)}{" "}
            {currentSymbolData?.name.replace("-PERP", "")}
          </div>
        </div>

        {/* Slider */}
        <div className="mb-10 px-2 relative">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={sliderPercentage}
            onChange={handleSliderChange}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={sliderStyle}
          />

          {/* Percentage Labels */}
          <div className="flex justify-between mt-4 text-xs font-medium text-gray-400 select-none px-0.5">
            {[0, 25, 50, 75, 100].map((percent) => (
              <div
                key={percent}
                className="cursor-pointer hover:text-gray-600 transition active:text-gray-900"
                onClick={() => handlePercentageClick(percent)}
              >
                {percent}%
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);
export function TradeModal({ isOpen, onClose, isIncrease }: TradeModalProps) {
  if (!isOpen) return null;

  const { selectedCoin } = useHydratedTradingStore();
  const { orderTab, setOrderTab } = useOrderFormStore();
  const [isOrderTypeModalOpen, setIsOrderTypeModalOpen] = useState(false);
  const { activeTab } = useTradingContextStore();
  const { address: walletAddress } = useAccount();

  const { data: openOrdersData, isLoading: isLoadingOpenOrders } =
    useUserOpenOrders(walletAddress, true);
  const { currentPosition } = useClearinghouseStore();
  const { currentSymbolData } = useMarketDataStore();
  const { midPrice } = useOrderBookStore();
  const coinDisplay = useMemo(
    () => (selectedCoin && selectedCoin.replace("-PERP", "")) || "",
    [selectedCoin],
  );
  const { markPrice, prevDayPrice } = useMemo(() => {
    return {
      markPrice: currentSymbolData?.price || "-",
      indexPrice: currentSymbolData?.oraclePx || "-",
      fundingRate: Number(currentSymbolData?.funding) * 100 || "-",
      prevDayPrice: currentSymbolData?.prevPrice
        ? String(currentSymbolData.prevPrice)
        : "-",
      volume24h: currentSymbolData?.volume24h
        ? String(currentSymbolData.volume24h)
        : "-",
    };
  }, [currentSymbolData]);
  const { setCurrentCoin } = useOrderBookStore();

  const [infoModal, setInfoModal] = useState<InfoModalData | null>(null);
  const [isLeverageModalOpen, setIsLeverageModalOpen] = useState(false);
  const [isAutoCloseModalOpen, setIsAutoCloseModalOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const { orderSize, setOrderSize, reduceOnly, triggerPrice } =
    useOrderFormStore();
  const { leverage, setLeverage } = useTradingContextStore();
  const [orderValue, setOrderValue] = useState<string>();

  const handleInfoClick = (title: string, description: string) => {
    setInfoModal({ title, description });
  };
  useEffect(() => {
    if (!isIncrease) {
      setOrderSize("");
    } else {
      setOrderSize(currentPosition?.positionValue || "");
    }
  }, [activeTab, setOrderSize]);
  useEffect(() => {
    const orderValue = () => {
      if (!Number(orderSize)) return setOrderValue("N/A");

      const orderSizeNum = parseFloat(orderSize);
      let valueUSD: number;
      valueUSD = orderSizeNum;
      setOrderValue(valueUSD.toString());
    };
    orderValue();
  }, [orderSize, currentSymbolData]);
  const marginRequired = useMemo(() => {
    if (!Number(orderSize) || !orderValue || orderValue === "N/A") return "N/A";
    const orderValueNum = Number(orderSize);
    if (!Number.isFinite(orderValueNum)) return "N/A";
    return (orderValueNum / leverage).toFixed(2);
  }, [orderSize, orderValue, reduceOnly, leverage]);
  const { change24hPrice, change24h } = useMemo(() => {
    if (prevDayPrice === "-" || markPrice === "-") {
      return { change24hPrice: 0, change24h: 0 };
    }
    const priceChange = Number(markPrice) - Number(prevDayPrice);
    const percentChange = (priceChange / Number(prevDayPrice)) * 100;
    return { change24hPrice: priceChange, change24h: percentChange };
  }, [prevDayPrice, markPrice]);

  const isPositive = change24h !== null && change24h >= 0;
  const {
    setReduceOnly,
    limitPrice,
    takeProfitStopLoss,
    setTakeProfitStopLoss,
    setLimitPrice,
  } = useOrderFormStore();

  // Auto-open limit modal when switching to limit tab without a price
  useEffect(() => {
    if (orderTab === "limit" && !limitPrice) {
      setIsLimitModalOpen(true);
    }
  }, [orderTab, limitPrice]);

  // Reset to market tab if limit modal closes without entering a price
  const handleLimitModalClose = () => {
    setIsLimitModalOpen(false);
  };
  const { form, context } = useTrading();
  const isEnableTrading = useUserStore((state) => state.isEnableTrading);

  const {
    leverage: currentLeverage,
    setLeverage: updateGlobalLeverage,
    setStatus,
  } = context;
  const { handleEnableTrading } = useEnableTrading();
  const { handlePlaceOrder } = usePlaceOrder({ isTrades: true });
  const maxLeverage = useMemo(() => {
    return currentSymbolData ? currentSymbolData.maxLeverage : 50;
  }, [currentSymbolData]);
  const { data: perpsState, isLoading: isLoadingBalance } =
    useClearinghouseState(walletAddress || "");
  const { invalidateUserOpenOrders } = useInvalidateHyperliquidQueries();

  const handleValidatedPlaceOrder = useCallback(
    async (walletAddress: string, isBuy: boolean) => {
      if (Number.isFinite(maxLeverage) && currentLeverage > maxLeverage) {
        setStatus({
          type: "error",
          message: `Requested leverage ${currentLeverage}x exceeds max allowed ${maxLeverage.toFixed(2)}x`,
        });
        return;
      }
      try {
        setReduceOnly(false);
        setCurrentCoin("USDC");
        await handlePlaceOrder(walletAddress, isBuy);
        if (orderTab === "limit") {
          invalidateUserOpenOrders(walletAddress);
        }
        onClose();
      } catch (error) {
        console.error("Error placing order121212:", error);
      }
    },
    [currentLeverage, maxLeverage, handlePlaceOrder, setStatus, context.status],
  );
  const isButtonDisabled = useMemo(() => {
    // Only apply validation for market, limit, twap, takeLimit, takeMarket, stopMarket, and stopLimit orders
    if (form.orderTab !== "market" && form.orderTab !== "limit") return false;

    // Check if orderSize is 0 or invalid
    const orderSizeNum = parseFloat(orderSize || "0");
    if (
      !orderSize ||
      orderSize === "" ||
      isNaN(orderSizeNum) ||
      orderSizeNum <= 0
    ) {
      return true;
    }

    // Check if margin required exceeds available balance
    if (perpsState?.withdrawable) {
      const withdrawable = parseFloat(perpsState.withdrawable || "0");
      const marginRequiredNum =
        marginRequired === "N/A" ? 0 : parseFloat(marginRequired || "0");
      if (marginRequiredNum > withdrawable) {
        return true;
      }
    }

    return false;
  }, [
    form.orderTab,
    orderSize,
    marginRequired,
    perpsState?.withdrawable,
    triggerPrice,
    limitPrice,
  ]);
  const { selectedCoin: coin } = useTradingContextStore();
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full overflow-auto flex flex-col px-4 py-4">
        {/* Header with back/close button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex cursor-pointer items-center gap-3">
            <ChevronLeft
              width={22}
              height={22}
              className="text-primary-primary"
              onClick={onClose}
            />

            <div className="flex flex-col items-start">
              <div className="flex flex-col justify-start items-start">
                <div className="flex gap-2 items-center">
                  <span className="body-body-semibold text-primary-primary">
                    {activeTab === "long" ? "Long" : "Short"} {coinDisplay}
                  </span>
                </div>

                <div className="flex flex-row gap-2">
                  <span className="text-primary-primary body-body-regular">
                    $
                    {formatPrice(
                      midPrice as number,
                      currentSymbolData?.decimals,
                    )}
                  </span>
                  <div className="flex items-center gap-1">
                    <span>
                      {isPositive ? (
                        <img
                          src="/perpetual-trading/up.svg"
                          width={10}
                          height={10}
                        />
                      ) : (
                        <img
                          src="/perpetual-trading/down.svg"
                          width={10}
                          height={10}
                        />
                      )}
                    </span>
                    <span
                      className={`${getTextStatusColor(isPositive)} body-body-semibold`}
                    >
                      {Math.abs(change24h).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOrderTypeModalOpen(true)}
              className="flex items-center justify-between button-secondary-container text-[#0187FF] rounded-lg py-2 px-3 gap-1 transition-colors"
            >
              <span className="body-body-meidum">
                {orderTab.charAt(0).toUpperCase() + orderTab.slice(1)}
              </span>
              <ChevronDown width={20} height={20} />
            </button>
          </div>
        </div>
        <div>
          <TradeInputSection
            markPrice={markPrice}
            onChange={(usdc) => {
              console.log("USDC changed:", usdc);
            }}
          />
        </div>
        <div className=" p-4 surface-page-background rounded-[12px] shadow-200 ">
          <div className="space-y-4">
            <div
              className="flex items-center justify-between pb-4 border-b border-border-secondary cursor-pointer hover:bg-gray-50/50 -mx-4 px-4 py-2 rounded-lg transition-colors"
              onClick={() => setIsLeverageModalOpen(true)}
            >
              <div className="flex items-center gap-2">
                <span className="body-body-regular text-primary-secondary">
                  Leverage
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInfoClick(
                      "Leverage",
                      "Leverage lets you trade with more than you put in. It can boost your profits, but also your losses. The higher the leverage, the riskier the trade.",
                    );
                  }}
                  className="cursor-help"
                >
                  <Info className="h-[13px] w-[13px] icon-default-secondary" />
                </button>
              </div>
              <span className="text-primary-primary body-body-regular">
                {leverage}x
              </span>
            </div>
            {orderTab === "limit" && (
              <div
                className="flex items-center justify-between pb-4 border-b border-border-secondary cursor-pointer hover:bg-gray-50/50 -mx-4 px-4 py-2 rounded-lg transition-colors"
                onClick={() => setIsLimitModalOpen(true)}
              >
                <div className="flex items-center gap-2">
                  <span className="body-body-regular text-primary-secondary">
                    Limit price
                  </span>
                </div>
                <span className="text-primary-primary body-body-regular">
                  ${limitPrice}
                </span>
              </div>
            )}
            {/* Open Interest */}
            <div
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50/50 -mx-4 px-4 py-2 rounded-lg transition-colors"
              onClick={() => setIsAutoCloseModalOpen(true)}
            >
              <div className="flex items-center gap-2">
                <span className="body-body-regular text-primary-secondary">
                  Auto close
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInfoClick(
                      "Take Profit & Stop Loss",
                      "Take Profit (TP) automatically closes your position when you reach your target profit. Stop Loss (SL) limits your losses by closing your position if the price moves against you.",
                    );
                  }}
                  className="cursor-help"
                >
                  <Info className="h-[13px] w-[13px] icon-default-secondary" />
                </button>
              </div>
              <CustomSwitch
                checked={takeProfitStopLoss}
                onCheckedChange={(checked) => {
                  setTakeProfitStopLoss(checked);
                  if (checked) {
                    setReduceOnly(false);
                  }
                }}
                size="sm"
              />
            </div>
          </div>

          {/* Info Modal */}
          <InfoModal
            isOpen={infoModal !== null}
            title={infoModal?.title || ""}
            description={infoModal?.description || ""}
            onClose={() => setInfoModal(null)}
          />
        </div>
        <div
          className="flex items-center justify-between mt-10 cursor-pointer pb-4 rounded-lg transition-colors"
          onClick={() => setIsLeverageModalOpen(true)}
        >
          <div className="flex items-center gap-2">
            <span className="body-body-regular text-primary-secondary">
              Margin
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleInfoClick(
                  "Margin",
                  "Margin is the money you put in to open a trade. It acts as collateral, and it's the most you can lose on that trade.",
                );
              }}
              className="cursor-help"
            >
              <Info className="h-[13px] w-[13px] icon-default-secondary" />
            </button>
          </div>
          <span className="text-primary-primary body-subtitle-semibold">
            ${marginRequired}
          </span>
        </div>

        {/* Open Interest */}
        <div
          className="flex items-center justify-between pb-4 cursor-pointer rounded-lg transition-colors"
          onClick={() => setIsAutoCloseModalOpen(true)}
        >
          <div className="flex items-center gap-2">
            <span className="body-body-regular text-primary-secondary">
              Liquidation price{" "}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleInfoClick(
                  "Liquidation Price",
                  "If the price hits this point, you'll be liquidated and lose your margin. Higher leverage makes liquidation more likely.",
                );
              }}
              className="cursor-help"
            >
              <Info className="h-[13px] w-[13px] icon-default-secondary" />
            </button>
          </div>
          <span className="text-primary-primary body-subtitle-semibold">
            {leverage}x
          </span>
        </div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="body-body-regular text-primary-secondary">
              Fees{" "}
            </span>
            <button
              onClick={() =>
                handleInfoClick(
                  "Reduce only",
                  "Reduce Only ensures this order can only decrease or close your existing position. It will not open a new position or increase your size.",
                )
              }
              className="cursor-help"
            >
              <Info className="h-[13px] w-[13px] icon-default-secondary" />
            </button>
          </div>
          <span className="text-primary-primary body-subtitle-semibold">
            {leverage}x
          </span>
        </div>
        <OrderButton
          isEnableTrading={isEnableTrading}
          isLoading={context.isLoading}
          sdkWithAgent={!!currentLeverage}
          coin={coin}
          isDisable={isButtonDisabled}
          onEnableTrading={() => handleEnableTrading(walletAddress || "")}
          onPlaceOrder={(isBuy) =>
            handleValidatedPlaceOrder(walletAddress || "", isBuy)
          }
        />
      </div>

      <OrderTypeModal
        isOpen={isOrderTypeModalOpen}
        onClose={() => setIsOrderTypeModalOpen(false)}
        onSelectOrderType={(type) => setOrderTab(type as "market" | "limit")}
        currentOrderType={orderTab}
      />
      <LeverageModal
        isOpen={isLeverageModalOpen}
        onClose={() => setIsLeverageModalOpen(false)}
        currentLeverage={leverage}
        onLeverageChange={setLeverage}
        maxLeverage={currentSymbolData?.maxLeverage || 20}
        currentSymbolData={currentSymbolData}
      />
      <AutoCloseModal
        isOpen={isAutoCloseModalOpen}
        onClose={() => setIsAutoCloseModalOpen(false)}
        currentPrice={String(markPrice)}
        liquidationPrice={0}
        onSetTakeProfit={(percentage) =>
          console.log("Take Profit:", percentage)
        }
        onSetStopLoss={(percentage) => console.log("Stop Loss:", percentage)}
      />
      <LimitModal isOpen={isLimitModalOpen} onClose={handleLimitModalClose} />
    </div>
  );
}
