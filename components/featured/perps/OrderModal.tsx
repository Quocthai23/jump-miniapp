import { ChevronLeft, Search } from "lucide-react";
import React, { memo, useRef } from "react";

import { useVirtualizer } from "@tanstack/react-virtual";
import TokenImage from "./TokenImage";

export interface OrderItem {
  coin: string;
  displayCoin: string;
  displaySide: string;
  displaySize: string;
  displayOrderType: string;
  limitPx: string;
  displayPrice: string;
  [key: string]: any;
}

interface OrderModalProps {
  rows: OrderItem[];
  onSelectOrder?: (order: OrderItem) => void;
  isOpen?: boolean;
  onClose?: () => void;
  searchQuery?: string;
}

export const OrderModal = memo(
  ({
    rows,
    onSelectOrder,
    isOpen = false,
    onClose,
    searchQuery = "",
  }: OrderModalProps) => {
    const parentRef = useRef(null);
    const [localSearchQuery, setLocalSearchQuery] = React.useState("");
    const [isSearching, setIsSearching] = React.useState(false);

    const combinedSearchQuery = isSearching ? localSearchQuery : searchQuery;
    const filteredOrders = combinedSearchQuery.trim()
      ? rows.filter((order) =>
          order.displayCoin
            .toLowerCase()
            .includes(combinedSearchQuery.toLowerCase()),
        )
      : rows;

    const rowVirtualizer = useVirtualizer({
      count: filteredOrders.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 72,
      overscan: 10,
    });

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white w-full h-full overflow-hidden flex flex-col py-4">
          {isSearching ? (
            <div className="flex items-center gap-2 mb-10 px-4">
              <div className="w-[90%] flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                <Search size={20} className="text-primary-secondary" />
                <input
                  type="text"
                  placeholder="Search by token symbol"
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent outline-none text-primary-primary placeholder-primary-secondary"
                />
              </div>
              <button
                onClick={() => {
                  setIsSearching(false);
                  setLocalSearchQuery("");
                }}
                className="text-primary-link font-medium"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-10 px-4">
              <ChevronLeft
                width={22}
                height={22}
                className="text-primary-primary cursor-pointer"
                onClick={onClose}
              />
              <span className="body-subtitle-semibold text-primary-primary">
                Select Order
              </span>
              <button
                onClick={() => setIsSearching(true)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <Search size={24} className="text-primary-primary" />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <div
              ref={parentRef}
              className="scrollbar-none h-full overflow-y-auto"
              role="list"
              aria-label="Order list"
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {filteredOrders.length === 0 ? (
                  <div className="text-primary-secondary text-body-sm-regular flex h-full flex-col items-center justify-center">
                    <p className="mt-4">No orders found</p>
                  </div>
                ) : (
                  rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const order = filteredOrders[virtualItem.index]!;

                    return (
                      <div
                        key={virtualItem.key}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                        onClick={() => onSelectOrder?.(order)}
                        className="hover:bg-gray-50 transition cursor-pointer"
                      >
                        <div className="flex items-start justify-between px-4 py-3">
                          <div className="flex items-center gap-2">
                            <TokenImage
                              symbol={order.displayCoin}
                              size={32}
                              alt={order.displayCoin}
                              className="h-8 w-8 rounded-full"
                            />
                            <div>
                              <p className="font-semibold body-body-semibold text-primary-primary">
                                {order.displayOrderType} {order.displaySide}
                              </p>
                              <p className="text-primary-secondary text-xs body-body-regular">
                                {order.displaySize} {order.displayCoin}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold body-subtitle-semibold text-primary-primary">
                              ${order.displayPrice}
                            </p>
                            <p className="text-primary-secondary text-xs body-body-regular">
                              {order.displayOrderType}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

OrderModal.displayName = "OrderModal";
