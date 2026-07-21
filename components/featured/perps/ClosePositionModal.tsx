import { useClearinghouseState } from "@/hooks/useHyperliquidQueries";
import { useTrading } from "@/hooks/useTrading";
import { useClearinghouseStore } from "@/state/clearinghouseStore";
import { useMarketDataStore } from "@/state/market/marketDataStore";
import { useOrderFormStore } from "@/state/trading/orderFormStore";
import { useTradingContextStore } from "@/state/trading/tradingContextStore";
import useUserStore from "@/state/user";
import { getTextStatusColor } from "@/utils/color";
import { formatPrice } from "@/utils/price";
import { ChevronLeft, Info } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { OrderButton } from "./components/trading/OrderButton";
import { useEnableTrading, usePlaceOrder } from "./hooks";
import { useOrderBookStore } from "@/state/orderBook";
interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}
interface InfoModalData {
  title: string;
  description: string;
}

const TradeInputSection = memo(
  ({
    setSliderPercentage,
    sliderPercentage,
    onChange,
  }: {
    setSliderPercentage: React.Dispatch<React.SetStateAction<number>>;
    sliderPercentage: number;
    onChange: (usdc: string) => void;
  }) => {
    const [valueUSDC, setValueUSDC] = useState("");
    const { currentPosition } = useClearinghouseStore();
    const [isFocused, setIsFocused] = useState(false);
    const { orderSize, setOrderSize, reduceOnly, triggerPrice } =
      useOrderFormStore();
    const { form, context } = useTrading();

    const { leverage } = useTradingContextStore();
    const { currentSymbolData } = useMarketDataStore();
    const { isLoading, perpsBalance } = useTradingContextStore();
    const { setSizePercent } = useOrderFormStore();
    const hasUserInteracted = useRef(false);
    const formatCoinAmount = (value: number) => {
      return value.toFixed(2);
    };
    useEffect(() => {
      // Only set initial values if user hasn't manually changed them
      if (currentPosition?.positionValue) {
        // form.setOrderSize(
        //   Number(currentPosition.positionValue).toFixed(2).toString(),
        // );
        setValueUSDC(
          Number(currentPosition.positionValue).toFixed(2).toString(),
        );
      }
    }, []);
    // Update input value when positionValue changes while maintaining the current percentage
    useEffect(() => {
      if (currentPosition?.positionValue && sliderPercentage > 0) {
        const newSize = calculateSizeFromPercentage(sliderPercentage);
        setValueUSDC(newSize);
        onChange(newSize);
      }
    }, [currentPosition?.positionValue]);
    // Calculate size from percentage based on position value
    const calculateSizeFromPercentage = (percent: number) => {
      if (!currentPosition?.positionValue) return "0.00";
      // Allocated size = position value × percentage
      const allocatedSize =
        Number(currentPosition.positionValue) * (percent / 100);
      return allocatedSize.toFixed(2);
    };

    // Handle slider change
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      hasUserInteracted.current = true;
      const value = parseFloat(e.target.value);
      setSliderPercentage(value);
      const newSize = calculateSizeFromPercentage(value);
      setValueUSDC(newSize);
      onChange(newSize);
      setSizePercent(value);
    };

    // Handle percentage button clicks
    const handlePercentageClick = (percent: number) => {
      hasUserInteracted.current = true;
      setSliderPercentage(percent);
      const newSize = calculateSizeFromPercentage(percent);
      setValueUSDC(newSize);
      onChange(newSize);
      setSizePercent(percent);
    };

    // Handle number input change
    const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      hasUserInteracted.current = true;
      let value = e.target.value;
      if (value === "") {
        setValueUSDC("");
        setSliderPercentage(0);
        setSizePercent(0);
        return;
      }

      // Allow decimal patterns
      if (!/^\d*\.?\d*$/.test(value)) return;

      setValueUSDC(value);
      setIsFocused(true);
      onChange(value);

      // Update slider: calculate percentage from size relative to position value
      if (currentPosition?.positionValue) {
        const numericValue = parseFloat(value);
        const percent =
          (numericValue / Number(currentPosition.positionValue)) * 100;
        const boundedPercent = Math.min(percent, 100);
        setSliderPercentage(boundedPercent);
        setSizePercent(boundedPercent);
      }
    };

    // On blur, format the value
    const handleSizeBlur = () => {
      setIsFocused(false);
      if (orderSize && orderSize !== "") {
        const numValue = parseFloat(orderSize);
        if (!isNaN(numValue) && numValue > 0) {
          const formatted = formatCoinAmount(numValue);
          setValueUSDC(formatted);
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
              value={valueUSDC != "NaN" ? valueUSDC : ""}
              onChange={handleSizeChange}
              onBlur={handleSizeBlur}
              className="display-lg flex-1 bg-transparent text-gray-900 outline-none transition-colors w-48"
              placeholder="0"
              disabled={isLoading}
            />
          </div>
          <div className="text-gray-500 text-sm font-medium">
            {currentPosition?.szi && !isNaN(Number(currentPosition?.szi))
              ? Math.abs(
                  Number(currentPosition?.szi) * (sliderPercentage / 100),
                ).toFixed(currentSymbolData?.szDecimals)
              : Number(0).toFixed(currentSymbolData?.szDecimals)}{" "}
            {currentSymbolData?.name?.replace("-PERP", "")}{" "}
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
export function ClosePositionModal({ isOpen, onClose }: TradeModalProps) {
  if (!isOpen) return null;
  const [orderValue, setOrderValue] = useState<string>();
  const [sliderPercentage, setSliderPercentage] = useState(100);
  const { currentPosition } = useClearinghouseStore();
  const { setCurrentCoin } = useOrderBookStore();
  const { selectedCoin: coin } = useTradingContextStore();
  const { currentSymbolData } = useMarketDataStore();
  const { orderSize, setOrderSize, reduceOnly, triggerPrice } =
    useOrderFormStore();
  const { leverage, setLeverage } = useTradingContextStore();
  const { address: walletAddress } = useAccount();
  const { setReduceOnly, limitPrice } = useOrderFormStore();

  useEffect(() => {
    // Only set initial values if user hasn't manually changed them
    if (isOpen) {
      setCurrentCoin("COIN");
      setLeverage(currentPosition?.leverage.value || 1);
      form.setOrderSize(
        Math.abs(
          Number(currentPosition?.szi) * (sliderPercentage / 100),
        ).toFixed(currentSymbolData?.szDecimals),
      );
    }
  }, [isOpen]);
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
  const [infoModal, setInfoModal] = useState<InfoModalData | null>(null);

  const handleInfoClick = (title: string, description: string) => {
    setInfoModal({ title, description });
  };

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
    const orderValueNum = Number(orderValue);
    if (!Number.isFinite(orderValueNum)) return "N/A";
    return (orderValueNum / Number(currentPosition?.leverage.value)).toFixed(2);
  }, [orderSize, orderValue, reduceOnly, currentPosition?.leverage.value]);
  const { change24hPrice, change24h } = useMemo(() => {
    if (prevDayPrice === "-" || markPrice === "-") {
      return { change24hPrice: 0, change24h: 0 };
    }
    const priceChange = Number(markPrice) - Number(prevDayPrice);
    const percentChange = (priceChange / Number(prevDayPrice)) * 100;
    return { change24hPrice: priceChange, change24h: percentChange };
  }, [prevDayPrice, markPrice]);

  const isPositive = change24h !== null && change24h >= 0;

  const { form, context } = useTrading();
  const isEnableTrading = useUserStore((state) => state.isEnableTrading);

  const {
    leverage: currentLeverage,
    setLeverage: updateGlobalLeverage,
    setStatus,
  } = context;
  const { handleEnableTrading } = useEnableTrading();
  const { handlePlaceOrder } = usePlaceOrder({ isClose: true });

  const { data: perpsState, isLoading: isLoadingBalance } =
    useClearinghouseState(walletAddress || "");
  const handleValidatedPlaceOrder = useCallback(
    async (walletAddress: string, isBuy: boolean) => {
      try {
        setReduceOnly(true);
        setCurrentCoin("COIN");

        setOrderSize(
          Math.abs(
            Number(currentPosition?.szi) * (sliderPercentage / 100),
          ).toFixed(currentSymbolData?.szDecimals),
        );
        await handlePlaceOrder(walletAddress, isBuy);
        onClose();
        setReduceOnly(false);
      } catch (error) {}
    },
    [currentLeverage, handlePlaceOrder, setStatus],
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

    return false;
  }, [
    form.orderTab,
    orderSize,
    marginRequired,
    perpsState?.withdrawable,
    triggerPrice,
    limitPrice,
  ]);
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
                    Close position
                  </span>
                </div>

                <div className="flex flex-row gap-2">
                  <span className="text-primary-primary body-body-regular">
                    ${formatPrice(markPrice, currentSymbolData?.decimals)}
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
        </div>
        <div>
          <TradeInputSection
            onChange={(usdc) => {
              console.log("USDC changed:", usdc);
            }}
            setSliderPercentage={setSliderPercentage}
            sliderPercentage={sliderPercentage}
          />
        </div>

        <div className="flex-1" />

        <div className="flex items-center justify-between cursor-pointer pb-4 rounded-lg transition-colors">
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
        <div className="flex items-center justify-between pb-4 cursor-pointer rounded-lg transition-colors">
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
          onPlaceOrder={(isBuy) => {
            const checkPosition =
              parseFloat(currentPosition?.szi || "0") > 0 ? false : true;

            handleValidatedPlaceOrder(walletAddress || "", checkPosition);
          }}
          isClosePosition={true}
        />
      </div>
    </div>
  );
}
