import { useMarketDataStore } from "@/state/market";
import { useOrderBookStore } from "@/state/orderBook";
import { useOrderFormStore } from "@/state/trading";
import { fromDisplayToSymbol } from "@/utils/displayCoin";
import { formatPrice } from "@/utils/price";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNotification } from "./NotificationToast";

interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LimitModal({ isOpen, onClose }: LimitModalProps) {
  const { currentSymbolData } = useMarketDataStore();
  const { midPrice } = useOrderBookStore();
  const { addNotification } = useNotification();
  const { limitPrice, setLimitPrice } = useOrderFormStore();
  const { setOrderTab } = useOrderFormStore();
  const [tempLimitPrice, setTempLimitPrice] = useState("");

  useEffect(() => {
    // Khi modal mở, set temp price từ store
    if (isOpen) {
      setTempLimitPrice(limitPrice);
    }
  }, [isOpen, limitPrice]);

  if (!currentSymbolData || !midPrice) return null;

  //   if (!isOpen) return null;

  const numLimit = parseFloat(tempLimitPrice) || 0;
  const isAbovePrice = numLimit > midPrice && numLimit > 0;
  const isBelowPrice = numLimit < midPrice && numLimit > 0;
  const isEmpty = tempLimitPrice === "" || numLimit === 0;

  // Determine border color
  let borderColor = "border-gray-200";
  if (isAbovePrice) {
    borderColor = "border-red-500";
  } else if (isBelowPrice) {
    borderColor = "border-green-500";
  }

  // Determine error/success message
  let messageColor = "";
  let messageText = "";
  let messageIcon = null;

  if (isAbovePrice) {
    messageColor = "text-red-500";
    messageIcon = "❌";
    messageText = "Limit price is above current price";
  } else if (isBelowPrice) {
    messageColor = "text-green-500";
    messageIcon = "✓";
    messageText = "Limit price is below current price";
  }

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setTempLimitPrice("");
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setTempLimitPrice(value);
    }
  };

  const handleConfirm = () => {
    if (!isEmpty && numLimit > 0) {
      setLimitPrice(tempLimitPrice);
      if (!tempLimitPrice) {
        setOrderTab("market");
      }
      setOrderTab("limit");
      addNotification({
        type: "success",
        title: "Set limit price successfully",
        duration: 3000,
      });
      onClose();
    }
  };
  const handleClose = () => {
    if (!tempLimitPrice) {
      setOrderTab("market");
    }
    onClose();
  };
  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300
        ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
      `}
      style={{ backgroundColor: "rgba(17, 17, 18, 0.6)" }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          fixed bottom-0 left-0 right-0 z-50 w-full
          rounded-t-2xl bg-white p-6 shadow-2xl
          transform transition-all duration-500 ease-out
          ${isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
        `}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center mb-6">
          <h2 className="text-primary-primary body-subtitle-semibold">
            Set limit price
          </h2>
          <button
            onClick={handleClose}
            className="absolute right-0 p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X width={24} height={24} className="text-gray-600" />
          </button>
        </div>

        {/* Limit Price Input */}
        <div className="mb-4">
          <label className="block body-body-regular text-primary-secondary mb-2">
            Limit price
          </label>
          <div
            className={`flex items-center border-2 rounded-xl px-4 py-3 transition-colors ${borderColor}`}
          >
            <span className="text-gray-900 font-semibold">$</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={tempLimitPrice}
              onChange={handleLimitChange}
              placeholder="0"
              className="flex-1 ml-2 bg-transparent outline-none text-gray-900 font-semibold"
            />
            <span className="text-gray-600 text-sm font-medium">USD</span>
          </div>
        </div>

        {/* Message */}
        {!isEmpty && messageText && (
          <div
            className={`flex items-center gap-2 mb-4 text-sm ${messageColor}`}
          >
            <span>{messageIcon}</span>
            <span className="font-medium">{messageText}</span>
          </div>
        )}

        {/* Current Price Info */}

        <span className="text-primary-secondary body-body-regular mb-6 block">
          {fromDisplayToSymbol(currentSymbolData?.name)} $
          {formatPrice(midPrice, currentSymbolData?.decimals)}
        </span>

        {/* Action Buttons */}

        <button
          onClick={handleConfirm}
          disabled={isEmpty || isAbovePrice}
          className={`flex-1 w-full rounded-full py-3  font-semibold text-white transition ${
            isEmpty || isAbovePrice
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          Set
        </button>
      </div>
    </div>
  );
}
