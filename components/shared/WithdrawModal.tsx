import { ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useWithdrawData } from "@/hooks/useWithdrawData";

interface WithdrawProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdraw?: (amount: number) => void;
}

export function WithdrawModal({ isOpen, onClose, onWithdraw }: WithdrawProps) {
  const withdrawData = useWithdrawData();
  const [amount, setAmount] = useState<string>("0");

  // Reset amount khi modal đóng
  useEffect(() => {
    if (!isOpen) {
      setAmount("0");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const isInsufficientBalance = numAmount > withdrawData.availableBalance;
  const isValidAmount =
    numAmount > 0 && numAmount <= withdrawData.availableBalance;
  const isDisabled = numAmount === 0;

  // Xác định màu sắc cho giá trị
  let amountColor = "text-[#717680]"; // Mặc định xám khi = 0
  if (numAmount > 0) {
    amountColor = isInsufficientBalance
      ? "text-red-500"
      : "text-primary-primary";
  }

  // Xác định trạng thái button
  let buttonClass = "bg-gray-300 cursor-not-allowed text-gray-500"; // Disabled
  let buttonText = "Withdraw";

  if (!isDisabled) {
    if (isInsufficientBalance) {
      buttonClass = "bg-[#FEE4E2] text-[#F04438]";
      buttonText = "Insufficient balance";
    } else if (isValidAmount) {
      buttonClass = "bg-blue-500 text-white";
      buttonText = "Withdraw";
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full overflow-hidden flex flex-col mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button onClick={onClose}>
            <ChevronLeft
              width={24}
              height={24}
              className="text-primary-primary"
            />
          </button>
          <h1 className="body-subtitle-semibold text-primary-primary flex-1 text-center">
            Withdraw
          </h1>
          <div className="w-6" />
        </div>

        {/* Content */}
        <div className="flex-1 px-4 py-6 overflow-y-auto">
          {/* Amount Display with Input */}
          <div className="mb-8 text-center">
            <div className="flex items-baseline justify-center gap-1 mb-4">
              <span className={`${amountColor} display-lg transition-colors`}>
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`text-5xl font-bold bg-transparent text-left outline-none transition-colors w-40 ${amountColor} ${
                  numAmount === 0
                    ? "border-gray-300"
                    : isInsufficientBalance
                      ? "border-red-500"
                      : "border-blue-500"
                }`}
                placeholder="0"
              />
            </div>
            <p className="body-body-regular text-primary-secondary">
              Available perps balance: $
              {withdrawData.availableBalance.toFixed(2)}
            </p>
          </div>

          {/* Receive Section */}
          <div className="space-y-4">
            {/* Receive */}
            <div className="flex items-center justify-between">
              <span className="body-body-regular text-primary-secondary">
                Receive
              </span>
              <div className="flex items-center gap-2">
                <img src="/perpetual-trading/USDC.svg" width={24} height={24} />
                <span className="body-subtitle-semibold text-primary-primary">
                  {withdrawData.currency}
                </span>
              </div>
            </div>

            {/* Provider Fee */}
            <div className="flex items-center justify-between">
              <span className="body-body-regular text-primary-secondary">
                Provider fee
              </span>
              <span className="body-subtitle-semibold text-primary-primary">
                ${withdrawData.providerFee.toFixed(2)}
              </span>
            </div>

            {/* Estimated Time */}
            <div className="flex items-center justify-between">
              <span className="body-body-regular text-primary-secondary">
                Estimated time
              </span>
              <span className="body-subtitle-semibold text-primary-primary">
                {withdrawData.estimatedTime}
              </span>
            </div>

            {/* You'll Receive */}
            <div className="flex items-center justify-between">
              <span className="body-body-regular text-primary-secondary">
                You'll receive
              </span>
              <span className="body-subtitle-semibold text-primary-primary">
                {numAmount > 0
                  ? `$${(numAmount - withdrawData.providerFee).toFixed(2)}`
                  : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4">
          <button
            onClick={() => {
              if (!isDisabled && isValidAmount) {
                onWithdraw?.(numAmount);
                onClose();
              }
            }}
            disabled={isDisabled || isInsufficientBalance}
            className={`w-full py-3 rounded-full body-subtitle-semibold transition-colors ${buttonClass}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
