import { useMemo, useState } from "react";
import { useHydratedTradingStore } from "@/hooks/useHydratedTradingStore";
import { useChart } from "@/contexts/ChartContext";
import { useFavoritesStore, useMarketDataStore } from "@/state/market";
import { useChartDataStore } from "@/state/chart/chartDataStore";
import { formatPrice } from "@/utils/price";
import { ChevronLeft, Star } from "lucide-react";
import { getTextStatusColor } from "../../../utils/color";
import TokenImage from "./TokenImage";
import { TypeChartModal } from "@/components/shared/TypeChartModal";
import { useNavigate } from "react-router";

export function PairInfoBar() {
  const { selectedCoin } = useHydratedTradingStore();
  const { changeChartType } = useChart();
  const [isChartTypeModalOpen, setIsChartTypeModalOpen] = useState(false);

  const { currentSymbolData } = useMarketDataStore();
  const { latestCandle } = useChartDataStore();
  const { favorites: favoritesRaw, toggleFavorite } = useFavoritesStore();
  const favorites = Array.isArray(favoritesRaw) ? favoritesRaw : [];
  const navigate = useNavigate();

  const coinDisplay = useMemo(
    () => (selectedCoin && selectedCoin.replace("-PERP", "")) || "",
    [selectedCoin],
  );
  const isFavorite = favorites.includes(String(currentSymbolData?.name));

  const {
    markPrice,
    chartPrice,
    indexPrice,
    fundingRate,
    prevDayPrice,
    volume24h,
  } = useMemo(() => {
    // Use latest chart candle close price if available, otherwise use market price
    const chartPrice = latestCandle?.close ? String(latestCandle?.close) : "";
    // ? String(latestCandle.close)
    // : currentSymbolData?.price || "-";

    return {
      markPrice: currentSymbolData?.price || "-",
      chartPrice: chartPrice,
      indexPrice: currentSymbolData?.oraclePx || "-",
      fundingRate: Number(currentSymbolData?.funding) * 100 || "-",
      prevDayPrice: currentSymbolData?.prevPrice
        ? String(currentSymbolData.prevPrice)
        : "-",
      volume24h: currentSymbolData?.volume24h
        ? String(currentSymbolData.volume24h)
        : "-",
    };
  }, [currentSymbolData, latestCandle]);

  const { change24hPrice, change24h } = useMemo(() => {
    if (prevDayPrice === "-" || markPrice === "-") {
      return { change24hPrice: 0, change24h: 0 };
    }
    const priceChange = Number(markPrice) - Number(prevDayPrice);
    const percentChange = (priceChange / Number(prevDayPrice)) * 100;
    return { change24hPrice: priceChange, change24h: percentChange };
  }, [prevDayPrice, markPrice]);

  const isLoading = !currentSymbolData;

  const isPositive = change24h !== null && change24h >= 0;

  const handleSelectChartType = (chartType: string) => {
    changeChartType(chartType);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex cursor-pointer items-center gap-2">
          <ChevronLeft
            width={22}
            height={22}
            className="text-primary-primary"
            onClick={() => navigate(`/`)}
          />
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
            <TokenImage
              symbol={selectedCoin}
              size={32}
              alt={selectedCoin}
              className="h-8 w-8 rounded-full"
            />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex flex-col justify-start items-start">
              <div className="flex gap-2 items-center">
                <span className="body-subtitle-semibold text-primary-primary">
                  {coinDisplay}
                </span>
                <span className="text-primary-secondary body-caption-semibold rounded-full surface-page-secondary px-2 py-1">
                  {currentSymbolData?.maxLeverage}x
                </span>
              </div>

              <span className="body-body-regular text-primary-secondary">
                Perp
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsChartTypeModalOpen(true)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src="/perpetual-trading/type-chart.svg"
              width={22}
              height={22}
            />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(String(currentSymbolData?.name));
            }}
            className={`transition-colors ${
              isFavorite ? "icon-warning-default " : "icon-default-secondary "
            }`}
          >
            <Star
              className="h-[19px] w-[19px]"
              fill={isFavorite ? "currentColor" : "none"}
              stroke="currentColor"
            />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-2">
        <span className="text-primary-primary display-md">
          ${formatPrice(chartPrice || markPrice, currentSymbolData?.decimals)}
        </span>
        <div className="flex items-center gap-1">
          <span>
            {isPositive ? (
              <img src="/perpetual-trading/up.svg" width={10} height={10} />
            ) : (
              <img src="/perpetual-trading/down.svg" width={10} height={10} />
            )}
          </span>
          <span
            className={`${getTextStatusColor(isPositive)} body-subtitle-semibold`}
          >
            {Math.abs(change24h).toFixed(2)}%
          </span>
        </div>
      </div>
      <TypeChartModal
        isOpen={isChartTypeModalOpen}
        onClose={() => setIsChartTypeModalOpen(false)}
        onSelectChartType={handleSelectChartType}
      />{" "}
    </div>
  );
}
