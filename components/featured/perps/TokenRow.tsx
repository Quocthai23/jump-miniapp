import { cn } from "@/packages/ui/src";
import type { MarketData } from "@/state/market";
import { formatPrice } from "@/utils/price";
import { memo } from "react";
import { useNavigate } from "react-router";
import TokenImage from "./TokenImage";

interface TokenRowProps {
  token: MarketData;
}

export const TokenRow = memo(({ token }: TokenRowProps) => {
  const navigate = useNavigate();

  const handleSelectCoin = () => {
    navigate(`/perps/${token.symbol}`);
  };

  return (
    <div
      onClick={handleSelectCoin}
      className={cn(
        "flex  w-full px-4 items-start justify-between rounded-none border-none  transition-colors hover:bg-gray-50",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex items-start gap-2">
          <div className="flex cursor-pointer items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
              <TokenImage
                symbol={token.symbol}
                size={32}
                alt={token.symbol}
                className="h-8 w-8 rounded-full"
              />
            </div>
            <div className="flex flex-col items-start">
              <div className="flex flex-col justify-start items-start">
                <div className="flex gap-2 items-center">
                  <span className="body-subtitle-semibold text-primary-primary">
                    {token.symbol}
                  </span>
                  <span className="text-primary-secondary body-caption-semibold rounded-full surface-page-secondary px-2 py-1">
                    {token?.maxLeverage}x
                  </span>
                </div>

                <span className="body-body-regular text-primary-secondary">
                  {token.price > 0 && (
                    <div className="text-body-xs-regular text-primary-secondary">
                      $
                      {token.volume24h >= 1e9
                        ? `${(token.volume24h / 1e9).toFixed(2)}B`
                        : token.volume24h >= 1e6
                          ? `${(token.volume24h / 1e6).toFixed(2)}M`
                          : token.volume24h.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                    </div>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-right">
        {token.price > 0 ? (
          <>
            <div className="text-primary-primary body-subtitle-semibold">
              ${formatPrice(token.price, token.decimals)}
            </div>
            <div
              className={
                token.change24h >= 0
                  ? "text-[#12B76A] body-body-semibold"
                  : "text-[#F04438] body-body-semibold"
              }
            >
              {token.change24h >= 0 ? "+" : ""}
              {token.change24h.toFixed(2)}%
            </div>
          </>
        ) : (
          <div className="text-body-xs-regular text-primary-secondary">N/A</div>
        )}
      </div>
    </div>
  );
});

TokenRow.displayName = "TokenRow";
