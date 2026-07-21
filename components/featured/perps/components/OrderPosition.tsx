import React, { useMemo, useState } from "react";
import { useOpenOrdersStore } from "@/state/openOrdersStore";
import { useHydratedTradingStore } from "@/hooks/useHydratedTradingStore";
import { fromDisplayToSymbol } from "@/utils/displayCoin";
import { formatPrice } from "@/utils/price";
import { formatTimeToDateAndTime, safeParseFloat } from "../utils";
import { TokenRowSkeleton } from "../TokenRowSkeleton";
import TokenImage from "../TokenImage";
import { CancelOrderModal } from "../CancelOrderModal";

interface OrderPosition {
  [key: string]: any;
  displayCoin?: string;
  displaySide?: string;
  displaySize?: string;
  displayOrderValue?: string;
  displayPrice?: string;
  displayTime?: string;
  displayOrderType?: string;
}

export const OrderPosition: React.FC = () => {
  const { openOrdersData } = useOpenOrdersStore();
  const { selectedCoin } = useHydratedTradingStore();
  const [selectedOrder, setSelectedOrder] = useState<OrderPosition | null>(
    null,
  );
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const filteredRows = useMemo(() => {
    if (!openOrdersData || !selectedCoin) return [];

    return openOrdersData
      .filter((order: any) => {
        return order.coin?.toLowerCase() === selectedCoin?.toLowerCase();
      })
      .map((order: any) => {
        const orderValue =
          safeParseFloat(order.origSz || order.sz) *
          safeParseFloat(order.limitPx);

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
  }, [openOrdersData, selectedCoin]);
  // Hide section if no filtered orders and data is loaded
  if (filteredRows.length === 0 && openOrdersData) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center mb-3 gap-2 mt-6">
        <h3 className="text-lg font-semibold body-subtitle-semibold text-primary-primary">
          Orders
        </h3>
      </div>

      <div className="flex flex-col surface-page-background rounded-xl gap-5 py-4 shadow-200">
        {!openOrdersData
          ? Array.from({ length: 3 }).map((_, i) => (
              <TokenRowSkeleton key={`order-skeleton-${i}`} />
            ))
          : filteredRows.map((item: OrderPosition, idx: number) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedOrder(item);
                  setIsCancelModalOpen(true);
                }}
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
                      Limit price
                    </p>
                  </div>
                </div>
              </div>
            ))}
      </div>

      <CancelOrderModal
        order={selectedOrder as any}
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedOrder(null);
        }}
        onBack={() => {
          setIsCancelModalOpen(false);
          setSelectedOrder(null);
        }}
        onCancelOrder={(order) => {
          setIsCancelModalOpen(false);
          setSelectedOrder(null);
        }}
      />
    </section>
  );
};

export default OrderPosition;
