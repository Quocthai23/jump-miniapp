import React, { memo, useRef } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import TokenImage from "./TokenImage";
import { fromDisplayToSymbol } from "@/utils/displayCoin";
import { formatPrice } from "@/utils/price";

interface PositionsModalProps {
  positions: any[];
  isOpen?: boolean;
  onClose?: () => void;
}

export const PositionsModal = memo(
  ({ positions, isOpen = false, onClose }: PositionsModalProps) => {
    if (!isOpen) return null;

    const parentRef = useRef(null);
    const [localSearchQuery, setLocalSearchQuery] = React.useState("");
    const [isSearching, setIsSearching] = React.useState(false);

    const filteredPositions = localSearchQuery.trim()
      ? positions.filter((position) =>
          fromDisplayToSymbol(position.coin)
            .toLowerCase()
            .includes(localSearchQuery.toLowerCase()),
        )
      : positions;

    const rowVirtualizer = useVirtualizer({
      count: filteredPositions.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 80,
      overscan: 10,
    });

    const getDirection = (liquidationPrice: number, entryPx: string) =>
      liquidationPrice < parseFloat(entryPx);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white w-full h-full overflow-hidden flex flex-col py-4">
          {isSearching ? (
            <div className="flex items-center gap-2 mb-4 px-4">
              <div className="w-[90%] flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                <Search size={20} className="text-primary-secondary" />
                <input
                  type="text"
                  placeholder="Search by coin symbol"
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
            <div className="flex items-center justify-between mb-4 px-4">
              <ChevronLeft
                width={22}
                height={22}
                className="text-primary-primary cursor-pointer"
                onClick={onClose}
              />
              <span className="body-subtitle-semibold text-primary-primary">
                Your Positions
              </span>
              <button
                onClick={() => setIsSearching(true)}
                className="p-1.5  rounded-lg transition"
              >
                <Search size={24} className="text-primary-primary" />
              </button>
            </div>
          )}

          {/* Positions List */}
          <div className="flex-1 overflow-hidden">
            <div
              ref={parentRef}
              className="scrollbar-none h-full overflow-y-auto"
              role="list"
              aria-label="Positions list"
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {filteredPositions.length === 0 ? (
                  <div className="text-primary-secondary text-body-sm-regular flex h-full flex-col items-center justify-center">
                    <p className="mt-4">No positions found</p>
                  </div>
                ) : (
                  rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const position = filteredPositions[virtualItem.index]!;
                    const symbol = fromDisplayToSymbol(position.coin);
                    const isLong = getDirection(
                      position.liquidationPrice,
                      position.entryPx,
                    );

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
                      >
                        <div className="px-4 py-2 transition">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <TokenImage
                                symbol={symbol}
                                size={32}
                                alt={symbol}
                                className="h-8 w-8 rounded-full"
                              />
                              <div className="flex-1">
                                <p className="font-semibold body-body-semibold text-primary-primary">
                                  {symbol} {position.leverage?.value}x{" "}
                                  {isLong ? "Long" : "Short"}
                                </p>
                                <p className="text-primary-secondary text-xs body-body-regular">
                                  {Math.abs(position.size).toFixed(4)} {symbol}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold body-subtitle-semibold text-primary-primary">
                                ${position.positionValue.toFixed(2)}
                              </p>
                              <p
                                className={`text-sm body-body-semibold ${position.roe < 0 ? "text-red-500" : "text-green-500"}`}
                              >
                                {formatPrice(position.unrealizedPnl)} (
                                {position.roe < 0 ? "" : "+"}
                                {position.roe.toFixed(2)}%)
                              </p>
                            </div>
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

PositionsModal.displayName = "PositionsModal";
