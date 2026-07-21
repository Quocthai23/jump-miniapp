import { ChevronDown, ChevronLeft, Search } from "lucide-react";
import React, { memo, useRef } from "react";

import type { MarketData } from "@/state/market";
import { useVirtualizer } from "@tanstack/react-virtual";
import { SortModal } from "./SortModal";
import { TokenRow } from "./TokenRow";

interface VirtualizedTokenListProps {
  tokens: MarketData[];
  onSelectCoin: (coin: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  isWatchlist?: boolean;
}

export const VirtualizedTokenList = memo(
  ({
    tokens,
    onSelectCoin,
    isOpen = false,
    onClose,
    isWatchlist = false,
  }: VirtualizedTokenListProps) => {
    const parentRef = useRef(null);
    const [localSearchQuery, setLocalSearchQuery] = React.useState("");
    const [isSearching, setIsSearching] = React.useState(false);
    const [sortBy, setSortBy] = React.useState<
      | "volume_high_low"
      | "volume_low_high"
      | "price_high_low"
      | "price_low_high"
      | "openInterest"
      | "fundingRate"
    >("volume_high_low");
    const [showSortModal, setShowSortModal] = React.useState(false);

    if (!isOpen) return null;

    const combinedSearchQuery = isSearching ? localSearchQuery : "";
    const filteredTokens = combinedSearchQuery.trim()
      ? tokens.filter((token) =>
          token.symbol
            .toLowerCase()
            .includes(combinedSearchQuery.toLowerCase()),
        )
      : tokens;

    const sortedTokens = [...filteredTokens].sort((a, b) => {
      if (sortBy === "volume_high_low") {
        return b.volume24h - a.volume24h;
      } else if (sortBy === "volume_low_high") {
        return a.volume24h - b.volume24h;
      } else if (sortBy === "price_high_low") {
        return b.price - a.price;
      } else if (sortBy === "price_low_high") {
        return a.price - b.price;
      } else {
        return b.volume24h - a.volume24h;
      }
    });

    const rowVirtualizer = useVirtualizer({
      count: sortedTokens.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 72,
      overscan: 10,
    });

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
                {isWatchlist ? "Watchlist" : "Explore Crypto"}
              </span>
              <button
                onClick={() => setIsSearching(true)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <Search size={24} className="text-primary-primary" />
              </button>
            </div>
          )}

          {/* Sort Button */}
          {!isSearching && (
            <div className="mb-4 px-4">
              <button
                onClick={() => setShowSortModal(true)}
                className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
              >
                <span className="body-button-semibold text-primary-primary">
                  {sortBy === "volume_high_low"
                    ? "Volume: High to Low"
                    : sortBy === "volume_low_high"
                      ? "Volume: Low to High"
                      : sortBy === "price_high_low"
                        ? "Price: High to Low"
                        : sortBy === "price_low_high"
                          ? "Price: Low to High"
                          : sortBy === "openInterest"
                            ? "Open interest"
                            : "Funding Rate"}
                </span>
                <ChevronDown size={20} strokeWidth={3} />
              </button>
            </div>
          )}

          {/* Token List */}
          <div className="flex-1 overflow-hidden">
            <div
              ref={parentRef}
              className="scrollbar-none h-full overflow-y-auto"
              role="list"
              aria-label="Token list"
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {sortedTokens.length === 0 ? (
                  <div className="text-primary-secondary text-body-sm-regular flex h-full flex-col items-center justify-center">
                    <p className="mt-4">No tokens found</p>
                  </div>
                ) : (
                  rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const token = sortedTokens[virtualItem.index]!;

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
                        <TokenRow token={token} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sort Modal */}
        <SortModal
          isOpen={showSortModal}
          onClose={() => setShowSortModal(false)}
          sortBy={sortBy}
          onSelectSort={(sortType) => setSortBy(sortType as any)}
        />
      </div>
    );
  },
);

VirtualizedTokenList.displayName = "VirtualizedTokenList";
