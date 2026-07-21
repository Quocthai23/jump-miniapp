import type React from "react";
import { useState } from "react";
import TokenImage from "../../TokenImage";
import { TabsContent } from "packages/ui/src/components/shared/atoms/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "packages/ui/src/components/shared/atoms/select";
import { Input } from "packages/ui/src/components/shared/atoms/input";
import {
  CircleAlert,
  CircleQuestionMark,
  EqualApproximately,
  RefreshCw,
} from "lucide-react";
import { LeverageDialogActions } from "./LeverageDialogActions";

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

const CHAINS = [
  {
    value: "arbitrum",
    label: "Arbitrum",
    icon: "/logo/logo.svg",
  },
  {
    value: "arbitrum-swap-usdt-usdc",
    label: "Arbitrum (Swap USDT for USDC)",
    icon: "/logo/logo.svg",
  },
  {
    value: "arbitrum-cctp",
    label: "Arbitrum (CCTP)",
    icon: "/logo/logo.svg",
  },
  {
    value: "ethereum",
    label: "Ethereum",
    icon: "/svg/crypto/eth.svg",
  },
  {
    value: "solana",
    label: "Solana",
    icon: "/svg/crypto/sol.svg",
  },
  {
    value: "monad",
    label: "Monad",
    icon: "/svg/crypto/monad.png",
  },
  {
    value: "hyperevm",
    label: "HyperEVM",
    icon: "/svg/crypto/hyper.png",
  },
];

export interface WithdrawTabProps {
  accountBalance: string;
  hyperliquidAssetOrder: string[];
  selectedChain: string;
  onSelectedChainChange: (value: string) => void;
  selectedToken: string;
  onSelectedTokenChange: (value: string) => void;
  isWithdrawing: boolean;
  walletConnected: boolean;
  onConfirm: (amount: number) => void;
  onClose: () => void;
  isEnableTrading: boolean;
  onEnableTrading: () => void;
}

export function WithdrawTab({
  accountBalance,
  hyperliquidAssetOrder,
  selectedChain,
  onSelectedChainChange,
  selectedToken,
  onSelectedTokenChange,
  isWithdrawing,
  walletConnected,
  onConfirm,
  onClose,
  isEnableTrading,
  onEnableTrading,
}: WithdrawTabProps) {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [rawWithdrawAmount, setRawWithdrawAmount] = useState("");

  const defaultChainForSelectedToken = getDefaultChainForToken(selectedToken);

  const parsedAccountBalance = (() => {
    const cleaned = (accountBalance || "").toString().replace(/,/g, "");
    const value = parseFloat(cleaned);
    if (!Number.isFinite(value)) return 0;
    return value;
  })();

  const parsedWithdrawAmount = parseFloat(rawWithdrawAmount || "0");
  const isBelowMinWithdraw =
    parsedWithdrawAmount > 0 && parsedWithdrawAmount < 2;
  const exceedsAccountBalance =
    parsedWithdrawAmount > 0 && parsedWithdrawAmount > parsedAccountBalance;
  const canWithdraw =
    walletConnected &&
    !isBelowMinWithdraw &&
    !exceedsAccountBalance &&
    parsedWithdrawAmount >= 2 &&
    !isWithdrawing;

  const handleWithdrawAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const raw = e.target.value.replace(/,/g, "");
    if (!/^\d*\.?\d*$/.test(raw)) return;

    setRawWithdrawAmount(raw);

    if (raw === "" || raw === ".") {
      setWithdrawAmount(raw);
      return;
    }

    const num = Number(raw);
    if (Number.isNaN(num)) {
      setWithdrawAmount("");
      return;
    }

    const [intPart, decPart = ""] = raw.split(".");
    const formattedInt = Number(intPart || "0").toLocaleString("en-US");
    const trimmedDec = decPart.slice(0, 2);

    const formatted =
      trimmedDec.length > 0 ? `${formattedInt}.${trimmedDec}` : formattedInt;

    setWithdrawAmount(formatted);
  };

  return (
    <TabsContent value="withdraw" className="mt-6 space-y-4">
      {/* Perpetual account balance */}
      <div className="flex items-center justify-between">
        <div className="text-body-md-regular flex items-center">
          <p className="text-neutral-300">Unsettled:</p>
          <p className="ml-1 text-red-500">0</p>
          <p className="ml-1 text-neutral-300">USDC</p>
        </div>

        <div className="text-primary-500 flex items-center">
          <RefreshCw className="h-4.5 w-4.5" />
          <p className="text-body-md-regular">Settle</p>
        </div>
      </div>

      <div className="relative">
        <p className="text-body-md-regular pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-green-100">
          Perpetual account balance
        </p>
        <div className="bg-surface-hover text-heading-xs-semibold h-full rounded-md pr-16 pl-52 text-right text-neutral-50">
          {accountBalance || "0.00"}
        </div>
        <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1">
          <p className="text-heading-xs-semibold text-neutral-300">USDC</p>
        </div>
      </div>

      {/* Withdraw Chain (same layout as Deposit but label adjusted) */}
      <div className="bg-surface-hover flex items-center justify-between rounded-md border border-neutral-700 px-3 py-1">
        <span className="text-body-md-regular text-primary-100">
          Withdraw Chain
        </span>
        <Select value={selectedChain} onValueChange={onSelectedChainChange}>
          <SelectTrigger className="text-body-lg-medium flex w-auto items-center gap-2 border-none bg-transparent px-0 py-0 text-neutral-50 focus:ring-0 focus:ring-offset-0">
            <SelectValue placeholder="Select chain" />
          </SelectTrigger>

          <SelectContent className="bg-surface-default text-body-lg-medium border-neutral-700">
            {CHAINS.map((c) => (
              <SelectItem
                key={c.value}
                value={c.value}
                disabled={defaultChainForSelectedToken !== c.value}
                className="text-neutral-50"
              >
                <div className="flex items-center gap-1">
                  <img
                    src={c.icon}
                    alt={c.label}
                    width={20}
                    height={20}
                    className="rounded-full"
                    loading="lazy"
                  />
                  {c.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-body-lg-medium text-neutral-50">Withdraw</p>
          <p className="text-body-md-regular text-neutral-50">
            Balance: {accountBalance || "0.00"}
          </p>
        </div>

        {/* Main input row (same layout as Deposit) */}
        <div className="bg-surface-secondary focus-within:border-primary-500 focus-within:bg-primary-700/15 relative flex items-center justify-between gap-3 rounded-lg border border-neutral-700 px-2 py-3">
          {/* Token select */}
          <Select value={selectedToken} onValueChange={onSelectedTokenChange}>
            <SelectTrigger className="bg-surface-default flex w-28 items-center justify-between rounded-md border-none text-neutral-50 focus:ring-0 focus:ring-offset-0">
              <div className="flex items-center gap-1 py-3">
                <SelectValue placeholder="USDC" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-surface-default text-body-lg-medium max-h-52 overflow-y-auto border-neutral-700">
              {hyperliquidAssetOrder.map((token) => (
                <SelectItem
                  key={token}
                  value={token}
                  className="text-neutral-50"
                >
                  <div className="flex items-center gap-1">
                    <TokenImage
                      symbol={token}
                      size={20}
                      alt={token}
                      className="rounded-full"
                    />
                    {token}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Amount input */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 rounded-md py-0.5">
              {["20%", "50%", "75%", "100%"].map((p) => {
                const percentage = parseInt(p) / 100;
                const amount = parsedAccountBalance * percentage;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setRawWithdrawAmount(amount.toString());
                      const [intPart, decPart = ""] = amount
                        .toString()
                        .split(".");
                      const formattedInt = Number(
                        intPart || "0",
                      ).toLocaleString("en-US");
                      const trimmedDec = decPart.slice(0, 2);
                      const formatted =
                        trimmedDec.length > 0
                          ? `${formattedInt}.${trimmedDec}`
                          : formattedInt;
                      setWithdrawAmount(formatted);
                    }}
                    className="text-body-sm-regular hover:text-primary-500 cursor-pointer rounded-[4px] bg-[#006F3726] p-1 text-neutral-50 transition-colors"
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <Input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={withdrawAmount}
              onChange={handleWithdrawAmountChange}
              className="!text-heading-md placeholder:!text-heading-md h-full w-full border-none bg-transparent py-0 text-right text-neutral-50 placeholder:text-neutral-600 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
        <div className="h-2">
          {isBelowMinWithdraw && (
            <p className="text-body-md-regular text-red-500">
              Minimum withdraw is 2 USDC.
            </p>
          )}
          {!isBelowMinWithdraw && exceedsAccountBalance && (
            <p className="text-body-md-regular text-red-500">
              Insufficient account balance.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-0.5">
          <p className="text-body-md-regular text-neutral-300">
            Withdraw fee: 0.00
          </p>
          <EqualApproximately className="h-4.5 w-4.5 text-neutral-300" />
          <p className="text-body-md-medium text-neutral-50">1 USDC</p>
          <CircleAlert className="h-4 w-4 text-neutral-400" />
        </div>

        <div className="flex items-center gap-0.5">
          <p className="text-body-md-medium text-yellow-500">
            Note: Withdraw requests can take a few minutes to confirm.
          </p>
          <CircleQuestionMark className="h-4 w-4 text-yellow-500" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <LeverageDialogActions
          onCancel={onClose}
          onConfirm={() => onConfirm(parsedWithdrawAmount)}
          isLoading={isWithdrawing}
          disabled={!canWithdraw}
          cancelLabel="Cancel"
          confirmLabel="Withdraw"
          loadingLabel="Withdrawing..."
          isEnableTrading={isEnableTrading}
          onEnableTrading={onEnableTrading}
        />
      </div>
    </TabsContent>
  );
}
