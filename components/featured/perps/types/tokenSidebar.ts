/**
 * Types for TokenSidebar component
 */

export type MarketItem = {
  id: string;
  symbol: string;
  name: string;
  coin: string; // Full coin name with -PERP
  price: number;
  maxLeverage: number | null;
  change24h: number;
  volume24h: number;
};

export type SortField = "volume24h" | "change24h" | null;
export type SortDirection = "asc" | "desc";
export type ActiveTab = "all" | "recent" | "favourite";
