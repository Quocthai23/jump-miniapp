import { useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { Button } from "packages/ui/src/components/shared/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "packages/ui/src/components/shared/atoms/dialog";
import type { Chain } from "wagmi/chains";
import { isTestnet } from "@/config/wagmi";

const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;
const ARBITRUM_MAINNET_CHAIN_ID = 42161;

const CHAIN_LOGOS_BY_ID: Record<number, string> = {
  1: "/svg/crypto/coin.svg", // Ethereum
  56: "/svg/crypto/coin.svg", // BNB Chain
  8453: "/svg/crypto/coin.svg", // Base
  42161: "/logo/arbitrum-arb-logo.png", // Arbitrum One
  421614: "/logo/arbitrum-arb-logo.png", // Arbitrum Sepolia
};

const CHAIN_LOGOS_BY_NAME: Record<string, string> = {
  Ethereum: "/svg/crypto/coin.svg",
  "BNB Chain": "/svg/crypto/coin.svg",
  "BNB Smart Chain": "/svg/crypto/coin.svg",
  Solana: "/svg/crypto/sol.svg",
  Aptos: "/svg/crypto/coin.svg",
  "Arbitrum One": "/logo/arbitrum-arb-logo.png",
  "Arbitrum Sepolia": "/logo/arbitrum-arb-logo.png",
  "ZKsync Era": "/svg/crypto/coin.svg",
  Linea: "/svg/crypto/coin.svg",
  "Monad Testnet": "/svg/crypto/coin.svg",
};

const getChainLogo = (chain?: Chain, targetChainId?: number) => {
  const fallbackId =
    targetChainId ??
    (isTestnet ? ARBITRUM_SEPOLIA_CHAIN_ID : ARBITRUM_MAINNET_CHAIN_ID);
  if (!chain) {
    return CHAIN_LOGOS_BY_ID[fallbackId] || "/logo/arbitrum-arb-logo.png";
  }
  return (
    CHAIN_LOGOS_BY_ID[chain.id] ||
    CHAIN_LOGOS_BY_NAME[chain.name] ||
    "/logo/arbitrum-arb-logo.png"
  );
};

interface NetworkDropdownProps {
  chains: readonly [Chain, ...Chain[]];
  currentChain?: Chain;
  onSwitchChain: (chainId: number) => void | Promise<void>;
}

export function NetworkDropdown({
  chains,
  currentChain,
  onSwitchChain,
}: NetworkDropdownProps) {
  const [open, setOpen] = useState(false);

  const targetChainId =
    currentChain?.id === ARBITRUM_SEPOLIA_CHAIN_ID ||
    currentChain?.id === ARBITRUM_MAINNET_CHAIN_ID
      ? currentChain.id
      : isTestnet
        ? ARBITRUM_SEPOLIA_CHAIN_ID
        : ARBITRUM_MAINNET_CHAIN_ID;

  const availableChains = chains.filter(
    (chain) =>
      chain.id === ARBITRUM_SEPOLIA_CHAIN_ID ||
      chain.id === ARBITRUM_MAINNET_CHAIN_ID,
  );

  const handleSelectChain = (chain: Chain) => {
    if (chain.id !== currentChain?.id) {
      onSwitchChain(chain.id);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="primary"
          size="custom"
          className="text-button-lg-medium rounded-lg border border-transparent bg-[#303030] px-2 py-2 transition-colors hover:border-transparent hover:bg-[#1b1b1b] md:px-3"
        >
          {/* Mobile: Only Globe icon */}
          <Globe className="h-5 w-5 text-white md:hidden" />

          {/* Desktop: Full content with chain logo, name, and chevron */}
          <div className="hidden w-full items-center justify-between gap-2 md:flex">
            <div className="flex items-center gap-1">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full">
                <img
                  src={getChainLogo(currentChain, targetChainId)}
                  alt={
                    currentChain?.name ??
                    (targetChainId === ARBITRUM_SEPOLIA_CHAIN_ID
                      ? "Arbitrum Sepolia"
                      : "Arbitrum One")
                  }
                  width={24}
                  height={24}
                  loading="lazy"
                />
              </span>
              <span className="text-body-sm-medium md:text-body-md-medium">
                {currentChain?.name ??
                  (targetChainId === ARBITRUM_SEPOLIA_CHAIN_ID
                    ? "Arbitrum Sepolia"
                    : "Arbitrum One")}
              </span>
            </div>
            <ChevronDown className="text-icon-primary h-4 w-4" />
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-surface-subtle w-full max-w-sm rounded-lg p-0 border-none">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-heading-sm-semibold text-neutral-50">
            Select Network
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col">
          {availableChains.map((chain) => {
            const isActive = chain.id === currentChain?.id;
            return (
              <button
                key={chain.id}
                type="button"
                onClick={() => handleSelectChain(chain)}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 text-left transition-colors ${
                  isActive ? "bg-neutral-500/30" : "hover:bg-neutral-500/10"
                }`}
              >
                <div className="flex items-center gap-2 px-6 py-4">
                  <span className="h-6 w-6 overflow-hidden rounded-full">
                    <img
                      src={getChainLogo(chain)}
                      alt={chain.name}
                      width={24}
                      height={24}
                      loading="lazy"
                    />
                  </span>
                  <span className="text-body-lg-medium text-neutral-50">
                    {chain.name}
                  </span>
                </div>
                {/* {isActive ? <Check className="h-4 w-4 text-[#03c987]" /> : null} */}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
