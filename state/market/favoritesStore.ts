import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FavoritesState {
  favorites: string[];
  addFavorite: (symbol: string) => void;
  removeFavorite: (symbol: string) => void;
  toggleFavorite: (symbol: string) => void;
  setFavorites: (symbols: string[]) => void;
  isFavorited: (symbol: string) => boolean;
  isLoading: boolean;
  initializeFavorites: () => void;
}

const FAVORITES_KEY = "tradingFavorites";

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isLoading: true,

      // Initialize from localStorage on first load
      initializeFavorites: () => {
        try {
          const stored = localStorage.getItem(FAVORITES_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            // Extract favorites array from persisted state
            const favorites = parsed.state?.favorites || parsed.favorites || [];
            set({
              favorites: Array.isArray(favorites) ? favorites : [],
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.warn("Failed to load favorites from localStorage:", error);
          set({ favorites: [], isLoading: false });
        }
      },

      addFavorite: (symbol: string) => {
        set((state) => {
          const favorites = Array.isArray(state.favorites)
            ? state.favorites
            : [];
          if (favorites.includes(symbol)) {
            return state;
          }
          const newFavorites = [symbol, ...favorites];
          localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
          return {
            favorites: newFavorites,
          };
        });
      },

      removeFavorite: (symbol: string) => {
        set((state) => {
          const favorites = Array.isArray(state.favorites)
            ? state.favorites
            : [];
          const newFavorites = favorites.filter((s) => s !== symbol);
          localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
          return {
            favorites: newFavorites,
          };
        });
      },

      toggleFavorite: (symbol: string) => {
        const state = get();
        const favorites = Array.isArray(state.favorites) ? state.favorites : [];
        if (favorites.includes(symbol)) {
          state.removeFavorite(symbol);
        } else {
          state.addFavorite(symbol);
        }
      },

      setFavorites: (symbols: string[]) => {
        const newFavorites = Array.isArray(symbols) ? symbols : [];
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
        set({ favorites: newFavorites, isLoading: false });
      },

      isFavorited: (symbol: string) => {
        const favorites = Array.isArray(get().favorites) ? get().favorites : [];
        return favorites.includes(symbol);
      },
    }),
    {
      name: "tradingFavorites",
      version: 1,
      onRehydrateStorage: () => (state) => {
        // Ensure favorites is always an array after hydration
        if (state && state.favorites && !Array.isArray(state.favorites)) {
          state.favorites = [];
        }
        if (state) {
          state.isLoading = false;
        }
      },
    },
  ),
);
