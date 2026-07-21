import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrum, base, polygon, bsc, arbitrumSepolia } from "wagmi/chains";
import type { Config } from "wagmi";

// Get your WalletConnect Project ID from https://cloud.walletconnect.com
// For now, using a placeholder - you'll need to replace this with your actual project ID
// const projectId =
//   typeof process !== "undefined" &&
//   process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
//     ? process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
//     : "65e3e21f958e2a3c73037447c9934669";

export const isTestnet = true;

let cachedConfig: Config | null = null;

// WalletConnect's default storage uses IndexedDB, which blows up during SSR.
// Build the config only in the browser and reuse it between renders.
export function getWagmiConfig(): Config | null {
  // if (typeof window === "undefined") {
  //   console.log("getWagmiConfig: SSR detected, returning null");
  //   return null};
  if (!cachedConfig) {
    cachedConfig = getDefaultConfig({
      appName: "Hyperliquid Trading App",
      projectId: "65e3e21f958e2a3c73037447c9934669",
      // Always include both Arbitrum networks; prefer one based on env flag.
      chains: true
        ? [arbitrumSepolia, arbitrum, bsc, base, polygon]
        : [arbitrum, arbitrumSepolia, bsc, base, polygon],
      ssr: true,
    });
  }

  return cachedConfig;
}
