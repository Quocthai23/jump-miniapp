import { ChevronLeft, ExternalLink } from "lucide-react";
import React, { memo } from "react";
import TokenImage from "./TokenImage";
import { fromDisplayToSymbol } from "@/utils/displayCoin";
import { formatPrice } from "@/utils/price";
import { useAccount } from "wagmi";

interface TradeDetailModalProps {
  trade: any | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export const TradeDetailModal = memo(
  ({ trade, isOpen = false, onClose }: TradeDetailModalProps) => {
    if (!isOpen || !trade) return null;
    const { address: walletAddress } = useAccount();
    const TESTNET = import.meta.env.TESTNET === 'true';

    const coinName = fromDisplayToSymbol(trade.coin as string);
    const closedPnl = Number(trade.closedPnl ?? 0);
    const fee = Number(trade.fee ?? 0);
    const netPnl = closedPnl - fee;

    // Format date and time
    const getFormattedDateTime = (timestamp: number) => {
      const date = new Date(timestamp);
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      };
      return date.toLocaleDateString("en-US", options);
    };

    const formattedDateTime = getFormattedDateTime(trade.time || Date.now());

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
        <div className="bg-white w-full h-full max-w-md max-h-screen overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <ChevronLeft
              width={24}
              height={24}
              className="text-primary-primary cursor-pointer"
              onClick={onClose}
            />
            <span className="text-primary-primary body-subtitle-semibold">
              {trade.dir}
            </span>
            <div className="w-6" />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Trade Direction and Coin */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <TokenImage
                  symbol={coinName}
                  size={60}
                  alt={coinName}
                  className="h-16 w-16 rounded-full"
                />
              </div>
              <p className="display-md text-primary-primary">
                {trade.sz} {coinName}
              </p>
            </div>

            {/* Details Section */}
            <div className="space-y-4 mb-6 shadow-200 rounded-[16px] p-4">
              {/* Date */}
              <div className="flex justify-between items-center pb-4 border-b border-border-secondary">
                <span className="text-sm text-primary-secondary">Date</span>
                <span className="body-body-semibold text-primary-primary">
                  {formattedDateTime}
                </span>
              </div>

              {/* Size/Value */}
              <div className="flex justify-between items-center pb-4 border-b border-border-secondary">
                <span className="text-sm text-primary-secondary">Size</span>
                <span className="body-body-semibold text-primary-primary">
                  ${(Number(trade.sz) * Number(trade.px)).toFixed(2)}
                </span>
              </div>

              {/* Entry Price or Close Price */}
              <div className="flex justify-between items-center pb-4 border-b border-border-secondary">
                <span className="text-sm text-primary-secondary">
                  {trade.dir?.toLowerCase().includes("close")
                    ? "Close Price"
                    : "Entry Price"}
                </span>
                <span className="body-body-semibold text-primary-primary">
                  ${Number(trade.px)}
                </span>
              </div>

              {trade.cx && (
                <div className="flex justify-between items-center pb-4 border-b border-border-secondary">
                  <span className="text-sm text-primary-secondary">
                    Close Price
                  </span>
                  <span className="body-body-semibold text-primary-primary">
                    ${formatPrice(Number(trade.cx), 3)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pb-4 border-b border-border-secondary">
                <span className="text-sm text-primary-secondary">
                  Total Fees
                </span>
                <span className="body-body-semibold text-primary-primary">
                  ${formatPrice(Math.abs(fee), 2)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-primary-secondary">Net P&L</span>
                <span
                  className={`body-body-semibold ${
                    netPnl >= 0 ? "text-[#12B76A]" : "text-[#F04438]"
                  }`}
                >
                  {netPnl >= 0 ? "+" : "-"}${formatPrice(Math.abs(netPnl), 2)}
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="p-4 pt-4 ">
            <button 
              onClick={() => {
                if (trade.hash) {
                  const explorerUrl = TESTNET
                    ? `https://app.hyperliquid.xyz/explorer/tx/${trade.hash}`
                    : `https://app.hyperliquid-testnet.xyz/explorer/tx/${trade.hash}`;
                  window.open(explorerUrl, '_blank');
                }
              }}
              className="w-full button-secondary-container text-primary-link body-subtitle-semibold py-3 rounded-full  transition flex items-center justify-center gap-2"
            >
              <ExternalLink size={20} strokeWidth={2.5}/>
              View on Block Explorer
            </button>
          </div>
        </div>
      </div>
    );
  },
);

TradeDetailModal.displayName = "TradeDetailModal";
