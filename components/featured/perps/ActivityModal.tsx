import { ChevronLeft } from "lucide-react";
import React, { memo, useEffect, useMemo } from "react";
import TokenImage from "./TokenImage";
import { fromDisplayToSymbol } from "@/utils/displayCoin";
import { formatPrice } from "@/utils/price";
import { TradeDetailModal } from "./TradeDetailModal";
import { useHistoricalOrders } from "@/hooks/useHyperliquidQueries";
import { useAccount } from "wagmi";
import { useTradeHistoryStore } from "@/state/trading/tradeHistoryStore";

export interface ActivityItem {
  px: string;
  sz: string;
  coin: string;
  side: string;
  dir: string;
  closedPnl?: number;
  fee?: number;
  time?: number;
  [key: string]: any;
}

interface ActivityModalProps {
  tradeHistory: any[];
  isOpen?: boolean;
  onClose?: () => void;
  isLoading?: boolean;
}

export const ActivityModal = memo(
  ({
    tradeHistory,
    isOpen = false,
    onClose,
    isLoading = false,
  }: ActivityModalProps) => {
    const [activeTab, setActiveTab] = React.useState<
      "trades" | "orders" | "funding"
    >("trades");
    const { address: walletAddress } = useAccount();
    const { data: orderHistoryData, isLoading: isLoadingOrderHistory } =
      useHistoricalOrders(walletAddress, true);
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
      console.log("orderHistoryData", storedOrderHistory);

    useEffect(() => {
      if (orderHistoryData) {
        const transformedOrderHistory = orderHistoryData.map((order: any) => ({
          order: order.order || order,
          status: order.status || "unknown",
          time: order.time || order.timestamp || Date.now(),
        }));
        setOrderHistory(transformedOrderHistory);
      }
      setLoadingOrderHistory(isLoadingOrderHistory);
    }, [
      orderHistoryData,
      isLoadingOrderHistory,
      setOrderHistory,
      setLoadingOrderHistory,
    ]);

    const [selectedTrade, setSelectedTrade] =
      React.useState<ActivityItem | null>(null);
    // Function to get date label (Today, Yesterday, or date format)
    const getDateLabel = (timestamp: number) => {
      const today = new Date();
      const tradeDate = new Date(timestamp);

      today.setHours(0, 0, 0, 0);
      tradeDate.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - tradeDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";

      // Format as "7 Feb" (e.g.)
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${tradeDate.getDate()} ${months[tradeDate.getMonth()]}`;
    };

    // Group trades by date
    const groupedTrades = useMemo(() => {
      if (!tradeHistory || tradeHistory.length === 0) return {};

      const groups: Record<string, typeof tradeHistory> = {};

      tradeHistory.forEach((trade) => {
        const dateLabel = getDateLabel(trade.time || Date.now());
        if (!groups[dateLabel]) {
          groups[dateLabel] = [];
        }
        groups[dateLabel].push(trade);
      });

      return groups;
    }, [tradeHistory]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0  flex items-center justify-center z-50">
        <div className="bg-white w-full h-full overflow-hidden flex flex-col py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 px-4">
            <ChevronLeft
              width={22}
              height={22}
              className="text-primary-primary cursor-pointer"
              onClick={onClose}
            />
            <span className="body-subtitle-semibold text-primary-primary">
              Activities
            </span>
            <div className="w-6" />
          </div>

          {/* Tabs */}
          <div className="flex gap-3 px-4 mb-6">
            <button
              onClick={() => setActiveTab("trades")}
              className={`px-4 py-2 rounded-[8px] font-semibold transition body-body-semibold ${
                activeTab === "trades"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-primary-primary"
              }`}
            >
              Trades
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded-[8px] font-semibold transition body-body-semibold ${
                activeTab === "orders"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-primary-primary"
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab("funding")}
              className={`px-4 py-2 rounded-[8px] font-semibold transition body-body-semibold ${
                activeTab === "funding"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-primary-primary"
              }`}
            >
              Funding
            </button>
          </div>

          {/* Transactions List */}
          <div className="flex-1 overflow-y-auto ">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-primary-secondary">Loading...</p>
              </div>
            ) : activeTab === "trades" ? (
              tradeHistory && tradeHistory.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(groupedTrades).map(([dateLabel, trades]) => (
                    <div key={dateLabel}>
                      {/* Date Header */}
                      <h3 className="body-body-regular text-primary-secondary mb-3 px-4">
                        {dateLabel}
                      </h3>
                      {/* Trades for this date */}
                      <div className="">
                        {trades.map((fill, idx) => {
                          const coinName = fromDisplayToSymbol(
                            fill.coin as string,
                          );
                          const closedPnl = Number(fill.closedPnl ?? 0);
                          const fee = Number(fill.fee ?? 0);
                          const netPnl = closedPnl - fee;

                          return (
                            <div
                              key={`trade-${dateLabel}-${idx}`}
                              className="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                              onClick={() => setSelectedTrade(fill)}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <TokenImage
                                  symbol={coinName}
                                  size={32}
                                  alt={coinName}
                                  className="h-8 w-8 rounded-full"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold body-body-semibold text-primary-primary">
                                    {fill.dir}
                                  </p>
                                  <p className="text-primary-secondary body-body-regular">
                                    {fill.sz} {coinName}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p
                                  className={`body-body-semibold ${netPnl >= 0 ? "text-[#12B76A]" : "text-[#F04438]"}`}
                                >
                                  {netPnl >= 0 ? "+" : "-"}$
                                  {Math.abs(Number(formatPrice(netPnl, 2)))}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📋</span>
                    </div>
                    <p className="text-primary-secondary body-body-regular">
                      No trades yet
                    </p>
                  </div>
                </div>
              )
            ) : activeTab === "orders" ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📦</span>
                  </div>
                  <p className="text-primary-secondary body-body-regular">
                    No orders yet
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💰</span>
                  </div>
                  <p className="text-primary-secondary body-body-regular">
                    No funding history yet
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Trade Detail Modal */}
          <TradeDetailModal
            trade={selectedTrade}
            isOpen={!!selectedTrade}
            onClose={() => setSelectedTrade(null)}
          />
        </div>
      </div>
    );
  },
);

ActivityModal.displayName = "ActivityModal";
