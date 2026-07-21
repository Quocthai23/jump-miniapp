import { TradingViewChart } from "./TradingViewChart";

interface ChartSwitcherProps {
  walletAddress?: string;
}

// type ChartType = "lightweight" | "tradingview";

export function ChartSwitcher() {
  return (
    <div className="flex h-full w-full flex-col">
      {/* Chart Type Selector */}

      {/* Chart Content */}
      <div className="relative flex-1">
        {/* <Chart walletAddress={walletAddress} /> */}

        <TradingViewChart />
      </div>
    </div>
  );
}
