import { useMarketDataStore } from "@/state/market";
import { useOrderBookStore } from "@/state/orderBook";
import { formatPrice } from "@/utils/price";
import { ChevronLeft, Info } from "lucide-react";
import { useState } from "react";

interface AutoCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrice: string;
  liquidationPrice: number;
  onSetTakeProfit: (percentage: number) => void;
  onSetStopLoss: (percentage: number) => void;
}

export function AutoCloseModal({
  isOpen,
  onClose,
  currentPrice,
  liquidationPrice,
  onSetTakeProfit,
  onSetStopLoss,
}: AutoCloseModalProps) {
  if (!isOpen) return null;

  const takeProfitOptions = [
    { label: "+10%", value: 10 },
    { label: "+25%", value: 25 },
    { label: "+50%", value: 50 },
    { label: "+100%", value: 100 },
  ];

  const stopLossOptions = [
    { label: "-5%", value: 5 },
    { label: "-10%", value: 10 },
    { label: "-25%", value: 25 },
    { label: "-50%", value: 50 },
  ];
  const { midPrice } = useOrderBookStore();
  const { currentSymbolData } = useMarketDataStore();
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full overflow-hidden flex flex-col px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <ChevronLeft
            width={22}
            height={22}
            className="text-primary-primary cursor-pointer"
            onClick={onClose}
          />
          <span className="body-subtitle-semibold text-primary-primary">
            Auto close
          </span>
          <div className="w-6" />
        </div>
        <div className="mb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="body-body-regular text-primary-secondary">
                {" "}
                Current price
              </span>
              <span className="body-subtitle-semibold text-primary-primary">
                ${formatPrice(midPrice as number, currentSymbolData?.decimals)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="body-body-regular text-primary-secondary">
                Liquidation price
              </span>
              <span className="body-subtitle-semibold text-primary-primary">
                ${liquidationPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1  space-y-8 pb-6">
          {/* Take Profit Section */}
          <div>
            <h3 className="body-subtitle-semibold text-primary-primary mb-4">
              Take profit
            </h3>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {takeProfitOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onSetTakeProfit(option.value)}
                  className="py-2.5 px-2 rounded-lg button-primary-on-container text-primary-primary body-button-semibold transition-colors first:bg-primary-primary first:text-white"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center border border-[#D5D7DA] rounded-[12px] px-3 py-2.5">
                <span className="text-primary-secondary body-body-regular">
                  $
                </span>
                <input
                  type="text"
                  placeholder="Trigger price"
                  className="flex-1 ml-2 bg-transparent text-primary-primary body-body-regular  placeholder:text-primary-secondary  border-none outline-none"
                />
              </div>
              <div className="flex items-center border border-[#D5D7DA] rounded-[12px] px-3 py-2.5">
                <span className="text-primary-secondary body-body-regular">
                  %
                </span>
                <input
                  type="text"
                  placeholder="Profit"
                  className="flex-1 ml-2 bg-transparent text-primary-primary body-body-regular  placeholder:text-primary-secondary border-none outline-none"
                />
                {/* <span className="text-primary-secondary text-sm">%</span> */}
              </div>
            </div>
          </div>

          {/* Stop Loss Section */}
          <div>
            <h3 className="body-subtitle-semibold text-primary-primary mb-4">
              Stop loss
            </h3>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {stopLossOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onSetStopLoss(option.value)}
                  className="py-2.5 px-2 rounded-lg button-primary-on-container text-primary-primary body-button-semibold transition-colors"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center border border-[#D5D7DA] rounded-[12px] px-3 py-2.5">
                <span className="text-primary-secondary body-body-regular">
                  $
                </span>
                <input
                  type="text"
                  placeholder="Trigger price"
                  className="flex-1 ml-2 bg-transparent text-primary-primary body-body-regular text-sm placeholder:text-primary-secondary border-none outline-none"
                />
              </div>
              <div className="flex items-center border border-[#D5D7DA] rounded-[12px] px-3 py-2.5">
                <span className="text-primary-secondary body-body-regular">
                  %
                </span>
                <input
                  type="text"
                  placeholder="Loss"
                  className="flex-1 ml-2 bg-transparent text-primary-primary body-body-regular text-sm placeholder:text-primary-secondary border-none outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-auto">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full button-primary-on-container text-primary-primary body-subtitle-semibold hover:bg-neutral-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full button-primary-container text-white body-subtitle-semibold transition-colors"
          >
            Set
          </button>
        </div>
      </div>
    </div>
  );
}
