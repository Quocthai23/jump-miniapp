import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface PendingPosition {
  id: string;
  coin: string;
  isBuy: boolean;
  size: number;
  limitPrice: number;
  createdAt: number;
  status: "pending" | "partial" | "cancelled";
}

interface PendingPositionsState {
  pendingPositions: PendingPosition;

  // Actions
  setPendingPositions: (positions: PendingPosition) => void;
}

export const usePendingPositionsStore = create<PendingPositionsState>()(
  subscribeWithSelector((set, get) => ({
    pendingPositions: {} as PendingPosition,

    setPendingPositions: (positions: PendingPosition) =>
      set({ pendingPositions: positions }),
  })),
);
