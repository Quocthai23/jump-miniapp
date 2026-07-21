import { create } from "zustand";

/**
 * Order level in the order book
 */
interface OrderLevel {
  px: string;
  sz: string;
  n: number;
}

/**
 * Simplified order book data structure - stores only best bid and best ask prices
 */
interface OrderBook {
  bidPrice: number;
  askPrice: number;
}

/**
 * WebSocket order book data
 */
interface WsBook {
  coin: string;
  levels: [OrderLevel[], OrderLevel[]];
  time: number;
}

/**
 * Full order book snapshot with time
 */
interface OrderBookData extends WsBook {}

/**
 * WebSocket trade data
 */
interface WsTrade {
  coin: string;
  side: string;
  px: string;
  sz: string;
  hash: string;
  time: number;
  tid: number;
}

interface OrderBookStore {
  // Current coin (e.g., "vvv" -> "vvv-PERP")
  currentCoin: string;
  setCurrentCoin: (coin: string) => void;

  // Current price when clicked
  clickedPrice: string;
  setClickedPrice: (price: string) => void;

  // Order book data with bids and asks
  orderbook: OrderBook | null;
  setOrderbook: (orderbook: OrderBook | null) => void;

  // Current mid price
  midPrice: number | undefined;
  setMidPrice: (price: number | undefined) => void;

  // Connection status
  isConnecting: boolean;
  setIsConnecting: (isConnecting: boolean) => void;
  connectionError: string | null;
  setConnectionError: (error: string | null) => void;

  // Order books data array
  orderbooksData: OrderBookData[];
  setOrderbooksData: (data: any[]) => void;
  addOrderbookData: (data: OrderBookData) => void;
  clearOrderbooksData: () => void;

  // Reset all state
  reset: () => void;
}

const initialState = {
  currentCoin: "",
  clickedPrice: "",
  orderbook: null,
  midPrice: undefined,
  isConnecting: false,
  connectionError: null,
  orderbooksData: [],
};

export const useOrderBookStore = create<OrderBookStore>((set) => ({
  ...initialState,

  setCurrentCoin: (coin: string) => {
    set({ currentCoin: coin });
  },
  setClickedPrice: (price: string) => set({ clickedPrice: price }),
  setOrderbook: (orderbook) => set({ orderbook }),
  setMidPrice: (price: number | undefined) => set({ midPrice: price }),
  setIsConnecting: (isConnecting: boolean) => set({ isConnecting }),
  setConnectionError: (error: string | null) => set({ connectionError: error }),
  setOrderbooksData: (data: OrderBookData[]) => set({ orderbooksData: data }),
  addOrderbookData: (data: OrderBookData) =>
    set((state) => ({
      orderbooksData: [...state.orderbooksData, data],
    })),
  clearOrderbooksData: () => set({ orderbooksData: [] }),

  reset: () => set(initialState),
}));

export type { OrderLevel, OrderBook, WsBook, WsTrade, OrderBookData };
