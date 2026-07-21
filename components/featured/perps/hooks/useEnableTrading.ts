import { isTestnet } from "@/config/wagmi";
import { useHyperliquid } from "@/contexts/HyperliquidContext";
import { useTrading } from "@/hooks/useTrading";
import useUserStore from "@/state/user";
import { getAgentAddress } from "@/utils/getAgentData";
import { useCallback } from "react";
import { isHex, parseSignature } from "viem";
import {
  useSignTypedData,
  useAccount,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";

const ARBITRUM_IDS = {
  mainnet: arbitrum.id,
  testnet: arbitrumSepolia.id,
} as const;

const approveAgentTypes = {
  "HyperliquidTransaction:ApproveAgent": [
    { name: "hyperliquidChain", type: "string" },
    { name: "agentAddress", type: "address" },
    { name: "agentName", type: "string" },
    { name: "nonce", type: "uint64" },
  ],
} as const;

/**
 * Hook for enabling trading (approving agent)
 */
export function useEnableTrading() {
  const { sdkWithAgent } = useHyperliquid();
  const { context } = useTrading();
  const { signTypedDataAsync } = useSignTypedData();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const setEnableTrading = useUserStore((state) => state.setEnableTrading);

  // Prefer the currently connected Arbitrum chain if already on one; otherwise
  // fall back to env flag. This prevents chainId mismatches in typed data.
  const targetChainId =
    chainId === ARBITRUM_IDS.testnet || chainId === ARBITRUM_IDS.mainnet
      ? chainId
      : isTestnet
        ? ARBITRUM_IDS.testnet
        : ARBITRUM_IDS.mainnet;
  const isTargetTestnet = targetChainId === ARBITRUM_IDS.testnet;
  const chainForEnable = targetChainId;

  const approveAgentDomain = {
    name: "HyperliquidSignTransaction",
    version: "1",
    chainId: chainForEnable,
    verifyingContract: "0x0000000000000000000000000000000000000000" as const,
  } as const;

  const handleEnableTrading = useCallback(
    async (walletAddress: string) => {
      if (!sdkWithAgent) {
        context.setStatus({
          type: "error",
          message: "SDK not initialized. Please refresh the page.",
        });
        return;
      }

      if (!walletAddress) {
        context.setStatus({
          type: "error",
          message: "Wallet address is required.",
        });
        return;
      }

      context.setIsLoading(true);
      context.setStatus(null);

      try {
        // Switch to the correct chain if not already on it
        if (chainId !== chainForEnable) {
          context.setStatus({
            type: "info",
            message: "Switching to the correct network...",
          });
          try {
            await switchChainAsync({ chainId: chainForEnable });
            // Wait a brief moment for the chain switch to be fully processed
            await new Promise((resolve) => setTimeout(resolve, 500));
            context.setStatus({
              type: "info",
              message:
                "Network switched successfully. Proceeding with approval...",
            });
          } catch (switchError) {
            // If chain switch fails, show error and stop
            context.setStatus({
              type: "error",
              message:
                "Network switch was cancelled or failed. Please switch to the correct network to enable trading.",
            });
            return; // Exit early if chain switch fails
          }
        }
        const agentData = getAgentAddress(walletAddress);
        if (!agentData) {
          return;
        }

        const agentAddress = agentData.address;
        const approveNonce = context.generateUniqueNonce();
        const approveAgentMessage = {
          hyperliquidChain: isTargetTestnet ? "Testnet" : "Mainnet",
          signatureChainId: `0x${chainForEnable.toString(16)}`,
          agentAddress,
          agentName: "",
          nonce: BigInt(approveNonce),
          type: "approveAgent",
        };

        const approveSignature = await signTypedDataAsync({
          domain: approveAgentDomain,
          types: approveAgentTypes,
          primaryType: "HyperliquidTransaction:ApproveAgent",
          message: {
            hyperliquidChain: approveAgentMessage.hyperliquidChain,
            agentAddress: approveAgentMessage.agentAddress as `0x${string}`,
            agentName: approveAgentMessage.agentName,
            nonce: BigInt(approveNonce),
          } as const,
        });

        const approveSigHex = (
          isHex(approveSignature) ? approveSignature : `0x${approveSignature}`
        ) as `0x${string}`;
        const parsedApproveSig = parseSignature(approveSigHex);
        const approveR = parsedApproveSig.r;
        const approveS = parsedApproveSig.s;
        let approveV = Number(parsedApproveSig.v);
        if (approveV === 0 || approveV === 1) {
          approveV += 27;
        }

        const approveAgentPayload = {
          action: {
            agentAddress: approveAgentMessage.agentAddress,
            hyperliquidChain: approveAgentMessage.hyperliquidChain,
            nonce: approveNonce,
            signatureChainId: approveAgentMessage.signatureChainId,
            type: "approveAgent",
          },
          expiresAfter: null,
          nonce: approveNonce,
          isFrontend: true,
          signature: { r: approveR, s: approveS, v: approveV },
          vaultAddress: null,
        };

        const approveResponse = await fetch(
          isTargetTestnet
            ? "https://api.hyperliquid-testnet.xyz/exchange"
            : "https://api.hyperliquid.xyz/exchange",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(approveAgentPayload),
          },
        );

        const approveResult = await approveResponse.json();

        if (!approveResponse.ok || approveResult.status === "err") {
          throw new Error(
            approveResult.response ||
              approveResult.message ||
              "Failed to approve agent",
          );
        }
        setEnableTrading(true);
      } catch (error: unknown) {
        console.error("Error enabling trading:", error);
        context.setStatus({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to enable trading. Please try again.",
        });
      } finally {
        context.setIsLoading(false);
      }
    },
    [
      sdkWithAgent,
      context,
      signTypedDataAsync,
      setEnableTrading,
      chainId,
      chainForEnable,
      switchChainAsync,
    ],
  );

  return { handleEnableTrading };
}
