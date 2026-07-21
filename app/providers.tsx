import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useAccount } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { getWagmiConfig } from "../config/wagmi";
import { HyperliquidProvider } from "@/contexts/HyperliquidContext";
import { getQueryClient } from "@/config/react-query";
import GlobalHook from "@/components/shared/GlobalHook";
import { NotificationProvider } from "@/components/shared/NotificationToast";

const queryClient = getQueryClient();

function HyperliquidWrapper({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  return (
    <HyperliquidProvider walletAddress={address || undefined}>
      {children}
    </HyperliquidProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const config = getWagmiConfig();
  // During SSR there's no window, so skip rendering until on the client.
  if (!config) return null;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
        // theme={darkTheme({
        //   accentColor: "#7c3aed",
        // })}
        >
          <HyperliquidWrapper>
            <NotificationProvider>
              <GlobalHook />
              {children}
            </NotificationProvider>
          </HyperliquidWrapper>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
