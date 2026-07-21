import { create } from "zustand";

interface OpenOrder {
  [key: string]: any;
}

interface OpenOrdersStore {
  openOrdersData: OpenOrder[] | null;
  setOpenOrdersData: (data: OpenOrder[]) => void;
  clearOpenOrdersData: () => void;
}

export const useOpenOrdersStore = create<OpenOrdersStore>((set) => ({
  openOrdersData: null,
  setOpenOrdersData: (data: OpenOrder[]) => {
    set({ openOrdersData: data });
  },
  clearOpenOrdersData: () => {
    set({ openOrdersData: null });
  },
}));
