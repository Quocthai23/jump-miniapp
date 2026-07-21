import { PairInfoBar } from "@/components/featured/perps/PairInfoBar";
// import { Trading } from "@/components/featured/perps/components/trading/Trading";
import { ChartSwitcher } from "@/components/featured/perps/ChartSwitcher";
// import { ChartSwitcher } from "components/featured/perps/ChartSwitcher";
import { Stats } from "@/components/featured/perps/components/Stats";
import { GuideTrading } from "@/components/featured/perps/components/GuideTrading";
import { OrderPosition } from "@/components/featured/perps/components/OrderPosition";
import { ChartProvider } from "@/contexts/ChartContext";
import { TradeModal } from "@/components/featured/perps/TradeModal";
import { ClosePositionModal } from "@/components/featured/perps/ClosePositionModal";
import { ModifyModal } from "@/components/featured/perps/ModifyModal";
import { ReversePositionModal } from "@/components/featured/perps/ReversePositionModal";
import { useEffect, useState } from "react";
import { useTradingContextStore } from "@/state/trading/tradingContextStore";
import { useHydratedTradingStore } from "@/hooks/useHydratedTradingStore";
import { useOrderFormStore } from "@/state/trading";
import PositionDetail from "@/components/featured/perps/components/PositionDetail";
import { useClearinghouseStore } from "@/state/clearinghouseStore";
import { useUserFees } from "@/hooks/useUserFees";

export default function Home() {
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [closePositionModalOpen, setClosePositionModalOpen] = useState(false);
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [reversePositionModalOpen, setReversePositionModalOpen] =
    useState(false);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const { setActiveTab } = useTradingContextStore();
  const { selectedCoin } = useHydratedTradingStore();
  const { setOrderTab } = useOrderFormStore();
  const { setLimitPrice } = useOrderFormStore();
  const { currentPosition } = useClearinghouseStore();
  useEffect(() => {
    setOrderTab("market");
    setLimitPrice("");
  }, [selectedCoin]);
  return (
    <ChartProvider>
      <div className="flex min-h-screen flex-col gap-2 overflow-hidden">
        <div className="px-4 py-3">
          <PairInfoBar />
        </div>
        <main className=" mt-0 flex min-w-0 space-x-2 lg:m-0 lg:mt-32.75 lg:ml-15">
          {/* Mobile Layout with Tabs */}
          <div className="flex min-w-0 flex-1 flex-col rounded-md ">
            <ChartSwitcher />
            <div className="mx-4">
              <PositionDetail />
              <OrderPosition />
              <Stats />
              <GuideTrading />
              <p className="text-primary-secondary body-caption-regular mt-8">
                Perpetual contracts are very risky, and you could suddenly and
                without notice lose your entire investment. You trade entirely
                at your own risk. Market data provided by Hyperliquid. Price
                chart powered by Trading View
              </p>
            </div>
            {currentPosition ? (
              <div
                className="mt-12 flex w-full gap-3 py-4 px-4 shadow-200"
                style={{ boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.15)" }}
              >
                <button
                  onClick={() => setModifyModalOpen(true)}
                  className="flex-1 rounded-full button-primary-on-container px-8 py-3  text-primary-primary body-subtitle-semibold"
                >
                  Modify
                </button>
                <button
                  onClick={() => {
                    setActiveTab("short");
                    setClosePositionModalOpen(true);
                  }}
                  className="flex-1 rounded-full button-primary-container px-8 py-3  text-white body-subtitle-semibold"
                >
                  Close {parseFloat(currentPosition.szi) > 0 ? "Long" : "Short"}
                </button>
              </div>
            ) : (
              <div
                className="mt-12 flex w-full gap-3 py-4 px-4"
                style={{ boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.15)" }}
              >
                <button
                  onClick={() => {
                    setActiveTab("long");
                    setTradeModalOpen(true);
                  }}
                  className="flex-1 rounded-full bg-[var(--green-500)] px-8 py-3  text-white body-subtitle-semibold"
                >
                  Long
                </button>
                <button
                  onClick={() => {
                    setActiveTab("short");
                    setTradeModalOpen(true);
                  }}
                  className="flex-1 rounded-full bg-[var(--red-500)] px-8 py-3  text-white body-subtitle-semibold"
                >
                  Short
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      {tradeModalOpen && (
        <TradeModal
          isOpen={tradeModalOpen}
          onClose={() => setTradeModalOpen(false)}
          isIncrease={isIncreasing}
        />
      )}
      <ClosePositionModal
        isOpen={closePositionModalOpen}
        onClose={() => setClosePositionModalOpen(false)}
      />
      <ModifyModal
        isOpen={modifyModalOpen}
        onClose={() => setModifyModalOpen(false)}
        onIncreaseExposure={() => {
          setActiveTab("long");
          setIsIncreasing(true);
          setTradeModalOpen(true);
          setModifyModalOpen(false);
        }}
        onReduceExposure={() => {
          setActiveTab("short");
          setIsIncreasing(false);
          setTradeModalOpen(true);
          setModifyModalOpen(false);
        }}
        onReversePosition={() => {
          setModifyModalOpen(false);
          setReversePositionModalOpen(true);
        }}
      />
      <ReversePositionModal
        isOpen={reversePositionModalOpen}
        onClose={() => setReversePositionModalOpen(false)}
      />
    </ChartProvider>
  );
}
