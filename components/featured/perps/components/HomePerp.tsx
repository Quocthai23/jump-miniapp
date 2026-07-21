import { ConnectAccountControls } from "@/components/shared/ConnectAccountControls";
import { WithdrawModal } from "@/components/shared/WithdrawModal";
import {
  useClearinghouseState,
  useUserOpenOrders,
} from "@/hooks/useHyperliquidQueries";
import { useTrading } from "@/hooks/useTrading";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { useClearinghouseStore } from "@/state/clearinghouseStore";
import { useOpenOrdersStore } from "@/state/openOrdersStore";
import { useFavoritesStore, useMarketDataStore } from "@/state/market";
import { fromDisplayToSymbol } from "@/utils/displayCoin";
import { getAgentAddress } from "@/utils/getAgentData";
import { formatPrice } from "@/utils/price";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useAccount } from "wagmi";
import { ActivityModal } from "../ActivityModal";
import { CancelOrderModal } from "../CancelOrderModal";
import { VirtualizedTokenList } from "../MarketModal";
import { OrderModal } from "../OrderModal";
import { PositionsModal } from "../PositionsModal";
import TokenImage from "../TokenImage";
import { TokenRow } from "../TokenRow";
import { TokenRowSkeleton } from "../TokenRowSkeleton";
import { formatTimeToDateAndTime, safeParseFloat } from "../utils";
import { useTradeHistoryStore } from "@/state/trading";

interface ActivityItem {
  icon: string;
  type: string;
  symbol: string;
  amount: number;
  change: number;
  isPositive: boolean;
}

export const HomePerp: React.FC = () => {
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [isPositionsModalOpen, setIsPositionsModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isCancelOrderModalOpen, setIsCancelOrderModalOpen] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);
  const {
    tradeHistory: storedTradeHistory,
    getFilteredTradeHistory,
    isLoadingTradeHistory,
  } = useTradeHistoryStore();
  const tradeHistory = getFilteredTradeHistory() || storedTradeHistory || [];
  const { assetPositions, isLoadingAssetPositions } = useClearinghouseStore();
  const { openOrdersData, setOpenOrdersData } = useOpenOrdersStore();
  const { form, context } = useTrading();
  const { address: walletAddress } = useAccount();
  const { data: perpsState, isLoading: isLoadingBalance } =
    useClearinghouseState(walletAddress || "");
  const { effectiveBalanceUSDC } = useUSDCBalance(walletAddress);
  const { data: queryOpenOrdersData, isLoading: isLoadingOpenOrders } =
    useUserOpenOrders(walletAddress, true);
  const { marketData, isLoading: isMarketDataLoading } = useMarketDataStore();
  const { favorites: favoriteCoinsRaw, isLoading: isFavoritesLoading } =
    useFavoritesStore();
  const { data: clearinghouseState } = useClearinghouseState(walletAddress);

  const navigate = useNavigate();
  const favoriteCoins = Array.isArray(favoriteCoinsRaw)
    ? favoriteCoinsRaw
    : typeof favoriteCoinsRaw === "object" && favoriteCoinsRaw !== null
      ? Object.values(favoriteCoinsRaw)
      : [];
  const tokens = marketData ?? [];
  const favoriteTokens = tokens.filter((token) =>
    favoriteCoins.includes(token.symbol),
  );

  const fundingRateByCoin = useMemo(() => {
    const map: Record<string, number> = {};
    (marketData || []).forEach((item: any) => {
      const nameKey = (item?.name || "").toUpperCase();
      const symbolKey = item?.symbol
        ? `${String(item.symbol).toUpperCase()}-PERP`
        : "";
      const fundingRate = Number(item?.funding);
      if (!Number.isNaN(fundingRate)) {
        if (nameKey) map[nameKey] = fundingRate;
        if (symbolKey) map[symbolKey] = fundingRate;
      }
    });
    return map;
  }, [marketData]);

  const markPriceByCoin = useMemo(() => {
    const map: Record<string, number> = {};
    (marketData || []).forEach((item: any) => {
      const nameKey = (item?.name || "").toUpperCase();
      const symbolKey = item?.symbol
        ? `${String(item.symbol).toUpperCase()}-PERP`
        : "";
      const price = Number(item?.price);
      if (!Number.isNaN(price)) {
        if (nameKey) map[nameKey] = price;
        if (symbolKey) map[symbolKey] = price;
      }
    });
    return map;
  }, [marketData]);

  const getDirection = (liquidationPrice: number, entryPx: string) =>
    liquidationPrice < parseFloat(entryPx);
  const rows = useMemo(() => {
    if (!openOrdersData) return [];
    return openOrdersData?.map((order: any) => {
      const orderValue =
        safeParseFloat(order.origSz || order.sz) *
        safeParseFloat(order.limitPx);

      const triggerCondition =
        order.isTrigger && order.triggerCondition
          ? order.triggerCondition
          : "N/A";

      return {
        ...order,
        displayCoin: fromDisplayToSymbol(order.coin) || "-",
        displaySide: order.side === "buy" ? "long" : "short",
        displaySize: order.sz || "0",
        displayOriginalSize: order.origSz || order.sz || "0",
        displayOrderValue: `${formatPrice(orderValue || 0)}`,
        displayPrice: formatPrice(order.limitPx || "0"),
        displayTime: formatTimeToDateAndTime(order.timestamp) || "-",
        displayOrderType: order.orderType || "Limit",
      };
    });
  }, [openOrdersData]);

  // Sync query data to store
  useEffect(() => {
    if (queryOpenOrdersData) {
      setOpenOrdersData(queryOpenOrdersData);
    }
  }, [queryOpenOrdersData, setOpenOrdersData]);

  useEffect(() => {
    if (walletAddress) {
      const agentInfo = getAgentAddress(walletAddress);
      if (!agentInfo) {
        context.setIsTradingEnabled(false);
      }
    }
  }, [walletAddress]);

  // Update perps balance on fetch
  useEffect(() => {
    if (perpsState) {
      const withdrawable = parseFloat(perpsState.withdrawable || "0");
      context.setPerpsBalance(`$${withdrawable.toFixed(2)}`);
      const agentInfo = getAgentAddress(walletAddress || "");
      context.setIsTradingEnabled(!!agentInfo);
    } else if (!isLoadingBalance) {
      context.setPerpsBalance("N/A");
      const agentInfo = getAgentAddress(walletAddress || "");
      context.setIsTradingEnabled(!!agentInfo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perpsState, isLoadingBalance, walletAddress]);

  // When turning on TP/SL, default to TP mode; when off, clear values
  useEffect(() => {
    if (form.takeProfitStopLoss) {
      form.setTpSlMode(form.tpSlMode ?? "tp");
    } else {
      form.setTpValue("");
      form.setSlValue("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.takeProfitStopLoss]);

  useEffect(() => {
    const positionsData = assetPositions || clearinghouseState?.assetPositions;

    if (!positionsData) {
      return;
    }

    const calculatedPositions = positionsData
      .filter(
        (pos: any) => pos.position && parseFloat(pos.position.szi || "0") !== 0,
      )
      .map((pos: any) => {
        const p = pos.position;
        const size = parseFloat(p.szi || "0");
        const entryPx = parseFloat(p.entryPx || "0");
        const marginUsed = parseFloat(p.marginUsed || "0");
        const positionValue = parseFloat(p.positionValue || "0");
        const liquidationPrice = parseFloat(p.liquidationPx || 0);
        const leverage = p.leverage?.value || 1;

        // Get mark price (realtime from marketData, fallback to API value)
        const coinKey = (p.coin || "").toUpperCase();
        const markPx =
          markPriceByCoin[coinKey] ||
          parseFloat(p.markPx || p.markPrice || "0") ||
          entryPx;

        // Get funding rate from marketData
        const fundingRate = fundingRateByCoin[coinKey] || 0;

        // Calculate Funding according to Hyperliquid formula
        const funding = size * markPx * fundingRate;

        // Calculate Unrealized PnL according to Hyperliquid formula
        const unrealizedPnl = (markPx - entryPx) * size;

        const absSize = Math.abs(size);
        const initialMargin =
          entryPx > 0 && leverage > 0 ? (entryPx * absSize) / leverage : 0;
        const roe =
          initialMargin > 0 ? (unrealizedPnl / initialMargin) * 100 : 0;

        return {
          coin: p.coin,
          size: size,
          entryPx: entryPx.toFixed(2),
          unrealizedPnl: unrealizedPnl.toFixed(2),
          leverage: p.leverage
            ? { value: p.leverage.value, type: p.leverage.type }
            : undefined,
          funding,
          marginUsed: marginUsed.toFixed(2),
          roe: roe,
          liquidationPrice,
          positionValue: positionValue,
        };
      });
    setPositions(calculatedPositions);
  }, [assetPositions, clearinghouseState, markPriceByCoin, fundingRateByCoin]);

  return (
    <div className="min-h-screen surface-page-background text-primary-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 surface-page-background border-b border-border-secondary px-4 py-3">
        <div className="flex items-center justify-between">
          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-semibold flex-1 text-center body-subtitle-semibold">
            Perpetual Trading
          </h1>
          <button
            onClick={() => setIsMarketModalOpen(true)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
          >
            <Search size={24} />
          </button>
        </div>
        <ConnectAccountControls />
      </header>

      {/* Main Content */}
      <div className="px-4 py-6">
        {/* Balance Section */}
        <div className="mb-6">
          <div className="surface-page-background rounded-[12px] p-4 shadow-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="body-subtitle-semibold text-primary-primary">
                  ${effectiveBalanceUSDC.toFixed(2)}
                </h2>
                <p className="text-primary-secondary text-sm mb-2 body-body-regular">
                  Available balance
                </p>
              </div>
              <img src="/perpetual-trading/USDC.svg" width={40} height={40} />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="flex-1 button-secondary-container text-primary-link font-medium py-3 rounded-full transition body-subtitle-semibold"
              >
                Withdraw
              </button>
              <button
                onClick={() => setShowAddFundsModal(true)}
                className="flex-1 button-primary-container text-white font-medium py-3 rounded-full transition body-subtitle-semibold"
              >
                Add funds
              </button>
            </div>
          </div>
        </div>
        {isLoadingOpenOrders || rows.length > 0 ? (
          <section className="mb-8">
            <div className="flex items-center mb-4 gap-2">
              <button
                onClick={() => setIsOrdersModalOpen(true)}
                className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition"
              >
                <h3 className="text-lg font-semibold body-subtitle-semibold text-primary-primary">
                  Your orders
                </h3>
                <ChevronRight size={18} className="text-primary-secondary" />
              </button>
            </div>

            <div className="flex flex-col surface-page-background rounded-xl gap-5 py-4 shadow-200">
              {isLoadingOpenOrders
                ? Array.from({ length: 3 }).map((_, i) => (
                    <TokenRowSkeleton key={`order-skeleton-${i}`} />
                  ))
                : rows.slice(0, 5).map((item, idx) => (
                    <div
                      key={idx}
                      className="hover:bg-gray-50 transition cursor-pointer px-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <TokenImage
                            symbol={item.displayCoin}
                            size={32}
                            alt={item.displayCoin}
                            className="h-8 w-8 rounded-full"
                          />
                          <div>
                            <p className="font-semibold body-body-semibold text-primary-primary">
                              {item.displayOrderType} {item.displaySide}
                            </p>
                            <p className="text-primary-secondary body-body-regular">
                              {item.displaySize} {item.displayCoin}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold body-subtitle-semibold text-primary-primary">
                            ${item.displayPrice}
                          </p>
                          <p className="text-primary-secondary body-body-regular">
                            {item.displayOrderType}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </section>
        ) : null}
        {isLoadingAssetPositions || positions.length > 0 ? (
          <section className="mb-8">
            <div className="flex items-center mb-4 gap-2">
              <button
                onClick={() => setIsPositionsModalOpen(true)}
                className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition"
              >
                <h3 className="text-lg font-semibold body-subtitle-semibold text-primary-primary">
                  Your positions
                </h3>
                <ChevronRight size={18} className="text-primary-secondary" />
              </button>
            </div>

            <div className="flex flex-col surface-page-background rounded-xl gap-5 py-4 shadow-200">
              {isLoadingAssetPositions
                ? Array.from({ length: 3 }).map((_, i) => (
                    <TokenRowSkeleton key={`position-skeleton-${i}`} />
                  ))
                : positions.map((position: any, idx) => (
                    <div
                      onClick={() => {
                        navigate(
                          `/perps/${fromDisplayToSymbol(position.coin)}`,
                        );
                      }}
                      key={idx}
                      className="  transition cursor-pointer px-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <TokenImage
                            symbol={fromDisplayToSymbol(position.coin)}
                            size={32}
                            alt={fromDisplayToSymbol(position.coin)}
                            className="h-8 w-8 rounded-full"
                          />
                          <div>
                            <p className="font-semibold body-body-semibold text-primary-primary">
                              {fromDisplayToSymbol(position.coin)}{" "}
                              {`${position.leverage.value}x`}{" "}
                              {getDirection(
                                position.liquidationPrice,
                                position.entryPx,
                              )
                                ? "Long"
                                : "Short"}
                            </p>
                            <p className="text-primary-secondary text-xs body-body-regular">
                              {Math.abs(position.size)}{" "}
                              {fromDisplayToSymbol(position.coin)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold body-subtitle-semibold text-primary-primary">
                            ${position.positionValue.toFixed(2)}
                          </p>
                          <p
                            className={`text-sm body-body-semibold ${position.roe < 0 ? "text-[#F04438]" : "text-[#12B76A]"}`}
                          >
                            {position.unrealizedPnl < 0 ? "-" : "+"}
                            ${Math.abs(Number(formatPrice(position.unrealizedPnl)))} (
                            {position.roe < 0 ? "" : "+"}
                            {position.roe.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </section>
        ) : null}

        {isFavoritesLoading ||
        isMarketDataLoading ||
        favoriteTokens.length > 0 ? (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setIsWatchlistModalOpen(true)}
                className="flex items-center gap-2 cursor-pointer  transition"
              >
                <h3 className="text-lg font-semibold flex items-center gap-2 body-subtitle-semibold text-primary-primary">
                  Watchlist
                  <ChevronRight size={18} className="text-primary-secondary" />
                </h3>
              </button>
            </div>

            <div className="surface-page-background rounded-xl shadow-200 overflow-hidden">
              <div className="flex flex-col gap-5 py-4">
                {isFavoritesLoading || isMarketDataLoading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <TokenRowSkeleton key={`watchlist-skeleton-${i}`} />
                    ))
                  : favoriteTokens
                      .slice(0, 5)
                      .map((token) => (
                        <TokenRow key={token.symbol} token={token} />
                      ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setIsMarketModalOpen(true)}
              className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition"
            >
              <h3 className="text-lg font-semibold flex items-center gap-2 body-subtitle-semibold text-primary-primary">
                Explore crypto
                <ChevronRight size={18} className="text-primary-secondary" />
              </h3>
            </button>
          </div>

          <div className="surface-page-background rounded-xl shadow-200 overflow-hidden">
            <div className="flex flex-col gap-5 py-4">
              {marketData && marketData.length > 0
                ? tokens
                    .slice(0, 5)
                    .map((token) => (
                      <TokenRow key={token.symbol} token={token} />
                    ))
                : Array.from({ length: 5 }).map((_, i) => (
                    <TokenRowSkeleton key={`explore-skeleton-${i}`} />
                  ))}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setIsActivityModalOpen(true)}
              className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition"
            >
              <h3 className="text-lg font-semibold flex items-center gap-2 body-subtitle-semibold text-primary-primary">
                Activity
                <ChevronRight size={18} className="text-primary-secondary" />
              </h3>
            </button>
          </div>

          <div className="surface-page-background rounded-xl shadow-200 flex flex-col gap-4 py-4">
            {isLoadingTradeHistory
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TokenRowSkeleton key={`activity-skeleton-${i}`} />
                ))
              : tradeHistory && tradeHistory.length > 0
                ? tradeHistory.slice(0, 5).map((fill, idx) => {
                    const coinName = fromDisplayToSymbol(fill.coin as string);
                    const closedPnl = Number(fill.closedPnl ?? 0);
                    const fee = Number(fill.fee ?? 0);
                    const netPnl = closedPnl - fee;

                    return (
                      <div
                        key={`trade-${idx}`}
                        className="flex items-center justify-between px-4 transition"
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
                  })
                : null}
          </div>
        </section>
      </div>

      {isWatchlistModalOpen && (
        <VirtualizedTokenList
          tokens={favoriteTokens as any[]}
          onSelectCoin={(coin) => {
            setIsWatchlistModalOpen(false);
          }}
          isOpen={isWatchlistModalOpen}
          onClose={() => setIsWatchlistModalOpen(false)}
          isWatchlist={true}
        />
      )}

      {isMarketModalOpen && (
        <VirtualizedTokenList
          tokens={tokens as any[]}
          onSelectCoin={(coin) => {
            setIsMarketModalOpen(false);
          }}
          isOpen={isMarketModalOpen}
          onClose={() => setIsMarketModalOpen(false)}
        />
      )}

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onWithdraw={(amount) => {
          console.log("Withdraw amount:", amount);
        }}
      />

      <PositionsModal
        positions={positions}
        isOpen={isPositionsModalOpen}
        onClose={() => setIsPositionsModalOpen(false)}
      />

      <OrderModal
        rows={rows}
        isOpen={isOrdersModalOpen}
        onClose={() => setIsOrdersModalOpen(false)}
        onSelectOrder={(order) => {
          setSelectedOrder(order);
          setIsOrdersModalOpen(false);
          setIsCancelOrderModalOpen(true);
        }}
      />

      <CancelOrderModal
        order={selectedOrder}
        isOpen={isCancelOrderModalOpen}
        onClose={() => {
          setIsCancelOrderModalOpen(false);
          setSelectedOrder(null);
        }}
        onBack={() => {
          setIsCancelOrderModalOpen(false);
          setIsOrdersModalOpen(true);
        }}
        onCancelOrder={(order) => {
          setIsCancelOrderModalOpen(false);
          setSelectedOrder(null);
        }}
      />

      <ActivityModal
        tradeHistory={tradeHistory}
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        isLoading={isLoadingTradeHistory}
      />
    </div>
  );
};

export default HomePerp;
