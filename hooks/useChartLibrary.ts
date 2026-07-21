/**
 * useChartLibrary - Manages TradingView library loading
 */

import { useEffect, useState, useCallback, useRef } from "react";
import type { ChartWidget } from "../types/tradingview";

const LIBRARY_TIMEOUT = 10000; // 10 seconds timeout
const CHECK_INTERVAL = 100; // Check every 100ms

declare global {
  interface Window {
    TradingView?: {
      widget: new (options: unknown) => ChartWidget;
    };
  }
}

export function useChartLibrary() {
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const loadLibrary = useCallback(async () => {
    // Prevent multiple concurrent load attempts
    if (isLoadingRef.current) {
      return Promise.resolve(isLibraryLoaded);
    }

    // Check if library is already loaded
    if (typeof window !== "undefined" && window.TradingView) {
      setIsLibraryLoaded(true);
      return Promise.resolve(true);
    }

    isLoadingRef.current = true;

    return new Promise<boolean>((resolve) => {
      let attempts = 0;
      const maxAttempts = Math.ceil(LIBRARY_TIMEOUT / CHECK_INTERVAL);

      const checkLibrary = setInterval(() => {
        if (typeof window !== "undefined" && window.TradingView) {
          clearInterval(checkLibrary);
          isLoadingRef.current = false;
          setIsLibraryLoaded(true);
          resolve(true);
          return;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(checkLibrary);
          isLoadingRef.current = false;
          const scriptExists = document.querySelector(
            'script[src*="charting_library"]',
          );
          const errorMessage = scriptExists
            ? "TradingView library script found but failed to initialize. Check browser console for JavaScript errors."
            : "TradingView library script not found. The charting_library.js file may be missing from /public/tradingview/.";

          setLibraryError(errorMessage);
          resolve(false);
        }
      }, CHECK_INTERVAL);
    });
  }, [isLibraryLoaded]);

  // Load library on mount (only once)
  useEffect(() => {
    if (!isLibraryLoaded && !libraryError) {
      loadLibrary();
    }
  }, [loadLibrary, isLibraryLoaded, libraryError]);

  return { isLibraryLoaded, libraryError, loadLibrary };
}
