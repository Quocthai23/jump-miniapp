import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";

export interface LatestCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartDataState {
  latestCandle: LatestCandle | null;
  setLatestCandle: (candle: LatestCandle) => void;
  clearLatestCandle: () => void;
}

export const useChartDataStore = create<ChartDataState>()(
  devtools(
    immer((set) => ({
      latestCandle: null,

      setLatestCandle: (candle: LatestCandle) => {
        set({ latestCandle: candle });
      },

      clearLatestCandle: () => {
        set({ latestCandle: null });
      },
    })),
  ),
);

// Helper to get current symbol's latest candle close price
export function getLatestCandlePrice(): number | null {
  const { latestCandle } = useChartDataStore.getState();
  return latestCandle?.close ?? null;
}
