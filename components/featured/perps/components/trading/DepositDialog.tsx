import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "packages/ui/src/components/shared/atoms/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "packages/ui/src/components/shared/atoms/tabs";
import {
  useInvalidateHyperliquidQueries,
  useSpotClearinghouseState,
} from "@/hooks/useHyperliquidQueries";
import { useHyperliquid } from "@/contexts/HyperliquidContext";
import {
  useAccount,
  useBalance,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { useTrading } from "@/hooks/useTrading";
import { DepositTab } from "./DepositTab";
import { WithdrawTab } from "./WithdrawTab";

const MIN_BRIDGE_DEPOSIT_USDC = 5;
const TESTNET = true;

const ARBITRUM_MAINNET_CHAIN_ID = 42161;
const ARBITRUM_TESTNET_CHAIN_ID = 421614;

const BRIDGE_ADDRESS_MAINNET =
  "0x2df1c51e09aecf9cacb7bc98cb1742757f163df7" as const;
const BRIDGE_ADDRESS_TESTNET =
  "0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89" as const;

const USDC_ADDRESS_MAINNET =
  "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as const;
const USDC_ADDRESS_TESTNET =
  "0x1baAbB04529D43a73232B713C0FE471f7c7334d5" as const;

const usdcAbi = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
] as const;

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance?: string;
  initialTab?: "deposit" | "withdraw";
  isEnableTrading: boolean;
  onEnableTrading: () => void;
}

export function DepositDialog({
  open,
  onOpenChange,
  balance = "0",
  initialTab = "deposit",
  isEnableTrading,
  onEnableTrading,
}: DepositDialogProps) {
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">(
    initialTab,
  );
  const [accountBalance, setAccountBalance] = useState(balance);
  const [selectedChain, setSelectedChain] = useState("arbitrum");
  const [selectedToken, setSelectedToken] = useState("USDC");
  const { sdkWithAgent } = useHyperliquid();
  const { address: walletAddress, chain } = useAccount();
  const publicClient = usePublicClient();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const { data: spotState, isLoading: isSpotBalanceLoading } =
    useSpotClearinghouseState(walletAddress, !!walletAddress);
  const { invalidateClearinghouseState, invalidateSpotClearinghouseState } =
    useInvalidateHyperliquidQueries();
  const { context } = useTrading();
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const tokenAddressBySymbol: Record<string, `0x${string}` | undefined> = {
    USDC: (TESTNET
      ? USDC_ADDRESS_TESTNET
      : USDC_ADDRESS_MAINNET) as `0x${string}`,
    USDT: undefined,
  };

  const selectedTokenAddress = tokenAddressBySymbol[selectedToken] ?? undefined;

  const {
    data: walletTokenOnChainBalance,
    isLoading: isWalletOnChainBalanceLoading,
  } = useBalance({
    address: walletAddress,
    token: selectedTokenAddress,
    chainId: TESTNET ? ARBITRUM_TESTNET_CHAIN_ID : ARBITRUM_MAINNET_CHAIN_ID,
    query: {
      enabled: !!walletAddress && !!selectedTokenAddress,
    },
  });

  useEffect(() => {
    setAccountBalance(balance);
  }, [balance]);

  const hyperliquidAssetOrder = [
    "USDC",
    "USDT",
    "BTC",
    "ETH",
    "SOL",
    "2Z",
    "BONK",
    "ENA",
    "FARTCOIN",
    "MON",
    "PUMP",
    "SPX",
    "XPL",
  ];

  const getDefaultChainForToken = (token: string): string => {
    switch (token) {
      case "USDC":
        return "arbitrum";
      case "USDT":
        return "arbitrum-swap-usdt-usdc";
      case "SOL":
      case "BONK":
      case "PUMP":
        return "solana";
      case "ETH":
      case "BTC":
      case "ENA":
      case "SPX":
      case "XPL":
      case "FARTCOIN":
      case "2Z":
        return "ethereum";
      case "MON":
        return "monad";
      default:
        return "hyperevm";
    }
  };

  useEffect(() => {
    const targetChain = getDefaultChainForToken(selectedToken);

    if (selectedChain !== targetChain) {
      setSelectedChain(targetChain);
    }
  }, [selectedToken, selectedChain]);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  const walletTokenBalance = (() => {
    if (!walletAddress) return "0.00";

    if (selectedTokenAddress) {
      if (isWalletOnChainBalanceLoading) return "...";
      if (!walletTokenOnChainBalance?.value) return "0.00";

      try {
        const formatted = formatUnits(
          walletTokenOnChainBalance.value,
          walletTokenOnChainBalance.decimals ?? 6,
        );
        const parsed = parseFloat(formatted);
        if (!Number.isFinite(parsed)) return "0.00";
        return parsed.toFixed(2);
      } catch {
        return "0.00";
      }
    }

    if (isSpotBalanceLoading) return "...";

    if (
      !spotState ||
      typeof spotState !== "object" ||
      !("balances" in spotState)
    ) {
      return "0.00";
    }

    const balances =
      (
        spotState as {
          balances?: Array<{ coin: string; total: string }>;
        }
      ).balances || [];

    const tokenName = selectedToken;
    const tokenBalance = balances.find(
      (bal) => bal.coin === tokenName || bal.coin === `${tokenName}-SPOT`,
    );

    if (!tokenBalance?.total) return "0.00";

    const parsed = parseFloat(tokenBalance.total);
    if (!Number.isFinite(parsed)) return "0.00";

    return parsed.toFixed(2);
  })();

  const handleDeposit = async (amount: number) => {
    if (!walletAddress) {
      context.setStatus({
        type: "error",
        message: "Please connect your wallet before depositing.",
      });
      return;
    }

    if (!walletClient) {
      context.setStatus({
        type: "error",
        message: "Wallet is not ready. Please try again.",
      });
      return;
    }

    if (selectedToken !== "USDC") {
      context.setStatus({
        type: "error",
        message: "Only USDC deposits are supported via the bridge.",
      });
      return;
    }

    if (!amount || amount <= 0) {
      context.setStatus({
        type: "error",
        message: "Enter a valid deposit amount.",
      });
      return;
    }

    if (amount < MIN_BRIDGE_DEPOSIT_USDC) {
      context.setStatus({
        type: "error",
        message:
          "Minimum bridge deposit is 5 USDC. Sending less will not be credited and funds will be lost.",
      });
      return;
    }

    const requiredChainId = TESTNET
      ? ARBITRUM_TESTNET_CHAIN_ID
      : ARBITRUM_MAINNET_CHAIN_ID;

    const bridgeAddress = (
      TESTNET ? BRIDGE_ADDRESS_TESTNET : BRIDGE_ADDRESS_MAINNET
    ) as `0x${string}`;

    const usdcAddress = (
      TESTNET ? USDC_ADDRESS_TESTNET : USDC_ADDRESS_MAINNET
    ) as `0x${string}`;

    if (selectedChain !== "arbitrum") {
      context.setStatus({
        type: "error",
        message: "This deposit route is not yet supported in the app.",
      });
      return;
    }
    if (chain?.id !== requiredChainId) {
      try {
        context.setStatus({
          type: "info",
          message: "Switching to the correct Arbitrum network for deposit...",
        });
        await switchChainAsync({ chainId: requiredChainId });
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        context.setStatus({
          type: "error",
          message:
            "Network switch was cancelled or failed. Please switch to the correct Arbitrum network to deposit.",
        });
        return;
      }
    }

    try {
      if (!publicClient) {
        throw new Error("RPC client not ready. Please try again.");
      }
      const owner = walletAddress as `0x${string}`;
      const value = parseUnits(amount.toString(), 6);
      context.setStatus({
        type: "info",
        message: "Submitting USDC transfer to the bridge...",
      });

      const txHash = await walletClient.writeContract({
        address: usdcAddress,
        abi: usdcAbi,
        functionName: "transfer",
        account: owner,
        args: [bridgeAddress, value],
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      invalidateClearinghouseState(walletAddress);
      invalidateSpotClearinghouseState(walletAddress);

      context.setStatus({
        type: "success",
        message:
          "Deposit submitted successfully. Funds will be credited after the bridge processes your transaction (usually under 1 minute).",
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Deposit error:", error);
      context.setStatus({
        type: "error",
        message:
          error?.message ||
          "Failed to submit deposit. Please try again or check Hyperliquid testnet.",
      });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async (amount: number) => {
    if (!walletAddress) {
      context.setStatus({
        type: "error",
        message: "Please connect your wallet before withdrawing.",
      });
      return;
    }

    if (!walletClient) {
      context.setStatus({
        type: "error",
        message: "Wallet is not ready. Please try again.",
      });
      return;
    }

    if (!amount || amount <= 0) {
      context.setStatus({
        type: "error",
        message: "Enter a valid withdraw amount.",
      });
      return;
    }

    try {
      setIsWithdrawing(true);
      context.setStatus({
        type: "info",
        message: "Submitting withdraw to your wallet...",
      });

      const amountStr = amount.toString();
      const timeMs = BigInt(Date.now());

      const actionForSign = {
        type: "withdraw3",
        hyperliquidChain: "Testnet",
        signatureChainId: "0x66eee",
        destination: walletAddress,
        amount: amountStr,
        time: timeMs,
      } as const;

      const domain = {
        name: "HyperliquidSignTransaction",
        version: "1",
        chainId: 421614,
        verifyingContract: "0x0000000000000000000000000000000000000000",
      } as const;

      const types = {
        "HyperliquidTransaction:Withdraw": [
          { name: "hyperliquidChain", type: "string" },
          { name: "destination", type: "string" },
          { name: "amount", type: "string" },
          { name: "time", type: "uint64" },
        ],
      } as const;

      const signatureHex = await walletClient.signTypedData({
        account: walletAddress,
        domain,
        types,
        primaryType: "HyperliquidTransaction:Withdraw",
        message: actionForSign,
      });

      const r = `0x${signatureHex.slice(2, 66)}`;
      const s = `0x${signatureHex.slice(66, 130)}`;
      const v = parseInt(signatureHex.slice(130, 132), 16);

      const actionPayload = {
        ...actionForSign,
        time: Number(timeMs),
      };

      if (!sdkWithAgent) {
        throw new Error(
          "Trading SDK not initialized. Please refresh the page.",
        );
      }

      const res = await sdkWithAgent.exchange.submitSignedWithdrawal(
        actionPayload,
        Number(timeMs),
        { r, s, v },
      );

      if (res?.status === "err" || res?.status === "error") {
        throw new Error(
          res?.response ||
            res?.error ||
            "Failed to submit withdraw. Please try again.",
        );
      }

      invalidateClearinghouseState(walletAddress);
      invalidateSpotClearinghouseState(walletAddress);

      context.setStatus({
        type: "success",
        message: "Withdraw submitted successfully.",
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Withdraw error:", error);
      context.setStatus({
        type: "error",
        message:
          error?.message ||
          "Failed to submit withdraw. Please try again or check Hyperliquid testnet.",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const walletConnected = !!walletAddress;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-default w-full p-6">
        <DialogTitle className="sr-only">Deposit and Withdraw</DialogTitle>
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "deposit" | "withdraw")
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-transparent">
            <TabsTrigger
              value="deposit"
              className="text-body-lg-medium data-[state=active]:border-primary-500 data-[state=active]:text-primary-500 relative rounded-none border-b-2 border-transparent px-0 pt-0 pb-2 text-neutral-400"
            >
              Deposit
            </TabsTrigger>
            <TabsTrigger
              value="withdraw"
              className="text-body-lg-medium data-[state=active]:border-primary-500 data-[state=active]:text-primary-500 relative rounded-none border-b-2 border-transparent px-0 pt-0 pb-2 text-neutral-400"
            >
              Withdraw
            </TabsTrigger>
          </TabsList>

          <DepositTab
            accountBalance={accountBalance}
            walletTokenBalance={walletTokenBalance}
            selectedChain={selectedChain}
            onSelectedChainChange={setSelectedChain}
            selectedToken={selectedToken}
            onSelectedTokenChange={setSelectedToken}
            hyperliquidAssetOrder={hyperliquidAssetOrder}
            isDepositing={isDepositing}
            walletConnected={walletConnected}
            onConfirm={handleDeposit}
            onClose={() => onOpenChange(false)}
            isEnableTrading={isEnableTrading}
            onEnableTrading={onEnableTrading}
          />

          <WithdrawTab
            accountBalance={accountBalance}
            hyperliquidAssetOrder={hyperliquidAssetOrder}
            selectedChain={selectedChain}
            onSelectedChainChange={setSelectedChain}
            selectedToken={selectedToken}
            onSelectedTokenChange={setSelectedToken}
            isWithdrawing={isWithdrawing}
            walletConnected={walletConnected}
            onConfirm={handleWithdraw}
            onClose={() => onOpenChange(false)}
            isEnableTrading={isEnableTrading}
            onEnableTrading={onEnableTrading}
          />
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
