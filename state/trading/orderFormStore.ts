import { create } from "zustand";

export type OrderTab = "market" | "limit";
// | "stopLimit"
// | "stopMarket"
// | "scale"
// | "twap"
// | "takeLimit"
// | "takeMarket";
export type LimitOrderType = "Gtc" | "Ioc" | "Alo";
export type SizeUnit = "USDC" | string;
export type Randomize = boolean;

// Scale order individual order preview
export interface ScaleOrderPreview {
  price: number;
  size: number;
  value: number;
}

export interface OrderFormState {
  // Form input values
  orderSize: string;
  limitPrice: string;
  triggerPrice: string;
  sizePercent: number;

  // Order configuration
  orderTab: OrderTab;
  limitOrderType: LimitOrderType;
  sizeUnit: SizeUnit;

  // Checkboxes
  orderConfirm: boolean;
  postChecked: boolean;
  reduceOnly: boolean;
  takeProfitStopLoss: boolean;

  // TP/SL settings
  tpSlMode: "tp" | "sl" | "both";
  tpValue: string;
  slValue: string;
  tpInputType: "price" | "offset";
  slInputType: "price" | "offset";

  // Randomize
  randomize: Randomize;

  // Scale order settings
  scaleStartPrice: string;
  scaleEndPrice: string;
  scaleTotalOrders: string;
  scaleSizeSkew: string;

  // TWAP order settings (UI: hours + minutes, API: total minutes)
  twapRunningTimeHours: string;
  twapRunningTimeMinutes: string;

  // Actions - Setters
  setOrderSize: (size: string) => void;
  setLimitPrice: (price: string) => void;
  setTriggerPrice: (price: string) => void;
  setSizePercent: (percent: number) => void;
  setOrderTab: (tab: OrderTab) => void;
  setLimitOrderType: (type: LimitOrderType) => void;
  setSizeUnit: (unit: SizeUnit) => void;
  setOrderConfirm: (confirm: boolean) => void;
  setPostChecked: (checked: boolean) => void;
  setReduceOnly: (reduce: boolean) => void;
  setTakeProfitStopLoss: (enabled: boolean) => void;
  setTpSlMode: (mode: "tp" | "sl" | "both") => void;
  setTpValue: (value: string) => void;
  setSlValue: (value: string) => void;
  setTpInputType: (type: "price" | "offset") => void;
  setSlInputType: (type: "price" | "offset") => void;
  setRandomize: (randomize: boolean) => void;

  // Scale order setters
  setScaleStartPrice: (price: string) => void;
  setScaleEndPrice: (price: string) => void;
  setScaleTotalOrders: (total: string) => void;
  setScaleSizeSkew: (skew: string) => void;

  // TWAP order setters
  setTwapRunningTimeHours: (hours: string) => void;
  setTwapRunningTimeMinutes: (minutes: string) => void;

  // Actions - Utility
  resetForm: () => void;
  cycleTpSlMode: () => void;
}

export const useOrderFormStore = create<OrderFormState>((set) => ({
  // Initial values
  orderSize: "",
  limitPrice: "",
  triggerPrice: "",
  sizePercent: 0,
  orderTab: "market",
  limitOrderType: "Gtc",
  sizeUnit: "USDC",
  orderConfirm: false,
  postChecked: false,
  reduceOnly: false,
  takeProfitStopLoss: false,
  tpSlMode: "tp",
  tpValue: "",
  slValue: "",
  tpInputType: "price",
  slInputType: "price",
  randomize: false,

  // Scale order initial values
  scaleStartPrice: "",
  scaleEndPrice: "",
  scaleTotalOrders: "10",
  scaleSizeSkew: "1.00",

  // TWAP order initial values
  twapRunningTimeHours: "",
  twapRunningTimeMinutes: "30",

  // Setters
  setOrderSize: (size) => set({ orderSize: size }),
  setLimitPrice: (price) => set({ limitPrice: price }),
  setTriggerPrice: (price) => set({ triggerPrice: price }),
  setSizePercent: (percent) => set({ sizePercent: percent }),
  setOrderTab: (tab) => set({ orderTab: tab }),
  setLimitOrderType: (type) => set({ limitOrderType: type }),
  setSizeUnit: (unit) => set({ sizeUnit: unit }),
  setOrderConfirm: (confirm) => set({ orderConfirm: confirm }),
  setPostChecked: (checked) => set({ postChecked: checked }),
  setReduceOnly: (reduce) => set({ reduceOnly: reduce }),
  setTakeProfitStopLoss: (enabled) => set({ takeProfitStopLoss: enabled }),
  setTpSlMode: (mode) => set({ tpSlMode: mode }),
  setTpValue: (value) => set({ tpValue: value }),
  setSlValue: (value) => set({ slValue: value }),
  setTpInputType: (type) => set({ tpInputType: type }),
  setSlInputType: (type) => set({ slInputType: type }),
  setRandomize: (randomize: Randomize) => set({ randomize: randomize }),

  // Scale order setters
  setScaleStartPrice: (price) => set({ scaleStartPrice: price }),
  setScaleEndPrice: (price) => set({ scaleEndPrice: price }),
  setScaleTotalOrders: (total) => set({ scaleTotalOrders: total }),
  setScaleSizeSkew: (skew) => set({ scaleSizeSkew: skew }),

  // TWAP order setters
  setTwapRunningTimeHours: (hours) => set({ twapRunningTimeHours: hours }),
  setTwapRunningTimeMinutes: (minutes) =>
    set({ twapRunningTimeMinutes: minutes }),

  // Utility actions
  resetForm: () =>
    set({
      orderSize: "",
      limitPrice: "",
      triggerPrice: "",
      sizePercent: 0,
      orderConfirm: false,
      postChecked: false,
      tpValue: "",
      slValue: "",
      scaleStartPrice: "",
      scaleEndPrice: "",
      scaleTotalOrders: "10",
      scaleSizeSkew: "1.00",
      twapRunningTimeHours: "",
      twapRunningTimeMinutes: "30",
    }),

  cycleTpSlMode: () =>
    set((state) => ({
      tpSlMode:
        state.tpSlMode === "tp"
          ? "sl"
          : state.tpSlMode === "sl"
            ? "both"
            : "tp",
    })),
}));
