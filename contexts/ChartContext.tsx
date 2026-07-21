import {
  createContext,
  useContext,
  useRef,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import type { ChartWidget } from "types/tradingview";

interface ChartContextType {
  widgetRef: React.RefObject<ChartWidget | null>;
  isChartReady: boolean;
  setChartReady: (ready: boolean) => void;
  changeChartType: (chartType: string) => void;
}

const ChartContext = createContext<ChartContextType | undefined>(undefined);

export function ChartProvider({ children }: { children: ReactNode }) {
  const widgetRef = useRef<ChartWidget | null>(null);
  const [isChartReady, setChartReady] = useState(false);

  const changeChartType = useCallback(
    (chartType: string) => {
      if (!widgetRef.current || !isChartReady) {
        console.warn("Chart not ready or widget not initialized", {
          hasWidget: !!widgetRef.current,
          isReady: isChartReady,
        });
        return;
      }

      try {
        const widget = widgetRef.current;
        const chart = widget.chart();
        const chartTypeNumber = parseInt(chartType, 10);

        // Try chart.setChartType first
        if (chart && typeof (chart as any).setChartType === "function") {
          (chart as any).setChartType(chartTypeNumber, () => {
            console.log("Chart type changed successfully to:", chartTypeNumber);
          });
          return;
        }

        // Try widget._innerAPI.setChartType as fallback
        if (
          (widget as any)._innerAPI &&
          typeof (widget as any)._innerAPI.setChartType === "function"
        ) {
          console.log("Using widget._innerAPI.setChartType");
          (widget as any)._innerAPI.setChartType(chartTypeNumber, () => {
            console.log(
              "Chart type changed successfully via _innerAPI to:",
              chartTypeNumber,
            );
          });
          return;
        }

        console.warn("No setChartType method found on chart or widget");
      } catch (err) {
        console.error("Error changing chart type:", err);
      }
    },
    [isChartReady],
  );

  return (
    <ChartContext.Provider
      value={{
        widgetRef,
        isChartReady,
        setChartReady,
        changeChartType,
      }}
    >
      {children}
    </ChartContext.Provider>
  );
}

export function useChart() {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within ChartProvider");
  }
  return context;
}

// Helper hook to set chart ready state
export function useSetChartReady() {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error("useSetChartReady must be used within ChartProvider");
  }

  return useCallback(() => {
    // Update the ref directly
    const chartRefTyped = context.widgetRef as any;
    if (chartRefTyped) {
      // Note: We'll need to update this from the component using a ref
    }
  }, [context.widgetRef]);
}
