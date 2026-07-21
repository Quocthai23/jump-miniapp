import { useClearinghouseStore } from "@/state/clearinghouseStore";
import { OrderButton } from "./components/trading/OrderButton";
import { useEnableTrading } from "./hooks/useEnableTrading";
import { usePlaceOrder } from "./hooks/usePlaceOrder";
import { useTrading } from "@/hooks/useTrading";
import useUserStore from "@/state/user";
import { useAccount } from "wagmi";
import { useCallback, useEffect, useMemo } from "react";
import { useMarketDataStore } from "@/state/market";
import { useTradingContextStore } from "@/state/trading";
import { useOrderBookStore } from "@/state/orderBook";

interface ReversePositionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReversePositionModal({
  isOpen,
  onClose,
}: ReversePositionModalProps) {
  const { currentPosition } = useClearinghouseStore();
  const { setCurrentCoin } = useOrderBookStore();
  const { currentSymbolData } = useMarketDataStore();
  const { selectedCoin: coin } = useTradingContextStore();
  const isLong = currentPosition && parseFloat(currentPosition.szi) > 0;
  const positionSize = currentPosition
    ? Math.abs(parseFloat(currentPosition.szi))
    : "0";
  const fromDirection = isLong ? "Long" : "Short";
  const toDirection = isLong ? "Short" : "Long";
  const estimatedFees = "$0.02"; // This should come from your actual calculation
  const { form, context } = useTrading();
  const isEnableTrading = useUserStore((state) => state.isEnableTrading);
  const { address: walletAddress } = useAccount();
  const {
    leverage: currentLeverage,
    setLeverage: updateGlobalLeverage,
    setStatus,
  } = context;
  const { handleEnableTrading } = useEnableTrading();
  const { handlePlaceOrder } = usePlaceOrder({ isReverse: true });
  const maxLeverage = useMemo(() => {
    return currentSymbolData ? currentSymbolData.maxLeverage : 50;
  }, [currentSymbolData]);
  useEffect(() => {
    if (isOpen) {
      setCurrentCoin("COIN");
      const newSize = Math.abs(Number(currentPosition?.szi) * 2).toString();
      form.setOrderSize(newSize);
    }
  }, [isOpen]);
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
        await handlePlaceOrder(walletAddress, isBuy);
        onClose();
      } catch (error) {
        console.error("Error placing order121212:", error);
      }
    },
    [currentLeverage, maxLeverage, handlePlaceOrder, setStatus, form],
  );
  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300
        ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
      `}
      style={{ backgroundColor: "rgba(17, 17, 18, 0.6)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          fixed bottom-0 left-0 right-0 z-50 w-full
          rounded-t-2xl surface-page-background p-4 shadow-2xl
          transform transition-all duration-500 ease-out
          ${isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
        `}
      >
        {/* Header with title and close button */}
        <div className="mb-8 mt-2 relative flex items-center justify-center">
          <h2 className="body-subtitle-semibold text-primary-primary">
            Reverse Position
          </h2>
          <button
            onClick={onClose}
            className="absolute right-0 text-2xl leading-none text-primary-secondary hover:text-primary-primary transition-colors"
          >
            ✕
          </button>
        </div>

        <div className=" p-4 surface-page-background rounded-[12px] shadow-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-border-secondary ">
              <span className="body-body-regular text-primary-secondary">
                Direction
              </span>
              <span className="text-primary-primary body-body-semibold">
                {fromDirection} <span className="mx-2">→</span> {toDirection}
              </span>
            </div>

            <div className="flex items-center justify-between ">
              <div className="flex items-center gap-2">
                <span className="body-body-regular text-primary-secondary">
                  Est. Size{" "}
                </span>
              </div>
              <span className="body-body-semibold text-primary-primary">
                {positionSize} {currentPosition?.coin.replace("-PERP", "")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-5 mb-12">
          <span className="text-primary-secondary body-body-regular">Fees</span>
          <span className="body-subtitle-semibold text-primary-primary">
            {estimatedFees}
          </span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-neutral-800 px-8 py-3 body-subtitle-semibold text-primary-primary button-primary-on-container transition-colors"
          >
            Cancel
          </button>
          <OrderButton
            isEnableTrading={isEnableTrading}
            isLoading={context.isLoading}
            sdkWithAgent={!!currentLeverage}
            coin={coin}
            onEnableTrading={() => handleEnableTrading(walletAddress || "")}
            onPlaceOrder={(isBuy) =>
              handleValidatedPlaceOrder(walletAddress || "", !isLong as boolean)
            }
            isReversePosition
          />
        </div>
      </div>
    </div>
  );
}
