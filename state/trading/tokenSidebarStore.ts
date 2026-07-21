import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TokenSidebarState {
  // Favorites
  favoriteCoins: string[];
  toggleFavorite: (coin: string) => void;

  recentCoins: string[];
  recordRecent: (coin: string) => void;
}

export const useTokenSidebarStore = create<TokenSidebarState>()(
  persist(
    (set) => ({
      // Favorites
      favoriteCoins: [],
      toggleFavorite: (coin: string) =>
        set((state) => {
          const exists = state.favoriteCoins.includes(coin);
          const updated = exists
            ? state.favoriteCoins.filter((c) => c !== coin)
            : [coin, ...state.favoriteCoins];
          return { favoriteCoins: updated };
        }),

      recentCoins: [],
      recordRecent: (coin: string) =>
        set((state) => {
          const without = state.recentCoins.filter((c) => c !== coin);
          const updated = [coin, ...without].slice(0, 15);
          return { recentCoins: updated };
        }),
    }),
    {
      name: "tokenSidebar-storage", // localStorage key
      version: 1,
    },
  ),
);
