import { useMarketDataStore } from "@/state/market";
import { getTextStatusColor } from "@/utils/color";
import { formatPrice } from "@/utils/price";
import { Info } from "lucide-react";
import { SkeletonPrice } from "packages/ui/src/components/shared/atoms/skeleton";
import { InfoModal } from "@/components/shared/InfoModal";
import { useMemo, useState } from "react";

interface StatsProps {
  isLoading?: boolean;
}

interface InfoModalData {
  title: string;
  description: string;
}

export function Stats({ isLoading = false }: StatsProps) {
  const { currentSymbolData } = useMarketDataStore();
  const { volume24h, openInterest, fundingRate } = useMemo(() => {
    return {
      volume24h: currentSymbolData?.volume24h
        ? formatPrice(currentSymbolData.volume24h)
        : "-",
      openInterest: currentSymbolData?.openInterest
        ? formatPrice(currentSymbolData.openInterest)
        : "-",
      fundingRate: Number(currentSymbolData?.funding) * 100 || "-",
    };
  }, [currentSymbolData]);

  const parsedFundingRate = useMemo(() => {
    const numericValue = Number(fundingRate);
    return Number.isFinite(numericValue) ? numericValue : null;
  }, [fundingRate]);

  const fundingRateDisplay =
    parsedFundingRate !== null ? parsedFundingRate.toFixed(4) : "-";

  const fundingRateColor =
    parsedFundingRate !== null
      ? getTextStatusColor(parsedFundingRate > 0)
      : "text-body-sm-medium dark:text-yellow-500";

  const [infoModal, setInfoModal] = useState<InfoModalData | null>(null);

  const handleInfoClick = (title: string, description: string) => {
    setInfoModal({ title, description });
  };

  return (
    <div className="pt-6">
      <h3 className="body-subtitle-semibold text-primary-primary mb-3">
        Stats
      </h3>
      <div className=" p-4 surface-page-background rounded-[12px] shadow-200">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-border-secondary ">
            <span className="body-body-regular text-primary-secondary">
              24h volume
            </span>
            {isLoading ? (
              <SkeletonPrice width={80} />
            ) : (
              <span className="text-primary-primary body-body-semibold">
                ${volume24h}
              </span>
            )}
          </div>

          {/* Open Interest */}
          <div className="flex items-center justify-between pb-4 border-b border-border-secondary ">
            <div className="flex items-center gap-2">
              <span className="body-body-regular text-primary-secondary">
                Open interest
              </span>
              <button
                onClick={() =>
                  handleInfoClick(
                    "Open interest",
                    "The combined value of all open positions for this perp.",
                  )
                }
                className="cursor-help"
              >
                <Info className="h-[13px] w-[13px] icon-default-secondary" />
              </button>
            </div>
            {isLoading ? (
              <SkeletonPrice width={80} />
            ) : (
              <span className="body-body-semibold text-primary-primary">
                ${openInterest}
              </span>
            )}
          </div>

          {/* Funding Rate */}
          <div className="flex items-center justify-between border-b  pb-4 border-border-secondary">
            <div className="flex items-center gap-2">
              <span className="body-body-regular text-primary-secondary">
                Funding rate
              </span>
              <button
                onClick={() =>
                  handleInfoClick(
                    "Funding rate",
                    "An hourly fee paid between traders to keep prices in line with the market. If the rate is positive, longs pay shorts. If negative, shorts pay longs.",
                  )
                }
                className="cursor-help"
              >
                <Info className="h-[13px] w-[13px] icon-default-secondary" />
              </button>
            </div>
            {isLoading ? (
              <SkeletonPrice width={80} />
            ) : (
              <span className={`body-body-semibold ${fundingRateColor}`}>
                {fundingRateDisplay}%{" "}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between  ">
            <div className="flex items-center gap-2">
              <span className="body-body-regular text-primary-secondary">
                Oracle price
              </span>
              <button
                onClick={() =>
                  handleInfoClick(
                    "Oracle price",
                    "The median of external prices reported by validators, used for computing funding rate.",
                  )
                }
                className="cursor-help"
              >
                <Info className="h-[13px] w-[13px] icon-default-secondary" />
              </button>
            </div>
            {isLoading ? (
              <SkeletonPrice width={80} />
            ) : (
              <span className="body-body-semibold text-primary-primary">
                $
                {formatPrice(
                  currentSymbolData?.oraclePx.toString() as string,
                  currentSymbolData?.decimals,
                )}
              </span>
            )}
          </div>
        </div>

        {/* Info Modal */}
        <InfoModal
          isOpen={infoModal !== null}
          title={infoModal?.title || ""}
          description={infoModal?.description || ""}
          onClose={() => setInfoModal(null)}
        />
      </div>
    </div>
  );
}
