import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "packages/ui/src/components/shared/atoms/dialog";
import { ButtonCustom } from "./ButtonCustom";
import { useAccount, useSignTypedData } from "wagmi";
import { parseSignature, isHex } from "viem";
import { TESTNET } from "@/contexts/HyperliquidContext";
import {
  useClearinghouseState,
  useSpotClearinghouseState,
  useInvalidateHyperliquidQueries,
} from "@/hooks/useHyperliquidQueries";
import { Input } from "packages/ui/src/components/shared/atoms/input";

const ARBITRUM_CHAIN_ID = TESTNET ? 421614 : 42161;
const ARBITRUM_CHAIN_ID_HEX = TESTNET ? "0x66eee" : "0xa4b1";
const EXCHANGE_ENDPOINT = TESTNET
  ? "https://api.hyperliquid-testnet.xyz/exchange"
  : "https://api.hyperliquid.xyz/exchange";

type StatusState = {
  type: "success" | "error" | "info";
  message: string;
} | null;

const PsDialogContent = ({
  open,
  onOpenChange,
  isEnableTrading,
  onEnableTrading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEnableTrading: boolean;
  onEnableTrading: () => void;
}) => {
  const [from, setFrom] = useState<"perps" | "spot">("perps");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<StatusState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { address: walletAddress } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { invalidateClearinghouseState, invalidateSpotClearinghouseState } =
    useInvalidateHyperliquidQueries();

  const { data: perpsState, isLoading: isLoadingPerps } = useClearinghouseState(
    walletAddress,
    !!walletAddress,
  );

  const { data: spotState, isLoading: isLoadingSpot } =
    useSpotClearinghouseState(walletAddress, !!walletAddress);

  const perpsBalance = useMemo(() => {
    if (!perpsState?.withdrawable) return 0;
    const parsed = parseFloat(perpsState.withdrawable);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [perpsState]);

  const spotBalance = useMemo(() => {
    if (
      !spotState ||
      typeof spotState !== "object" ||
      !("balances" in spotState)
    ) {
      return 0;
    }
    const balances = (
      spotState as {
        balances?: Array<{ coin: string; total: string }>;
      }
    ).balances;
    if (!Array.isArray(balances)) return 0;
    const usdcBalance = balances.find(
      (bal) => bal.coin === "USDC" || bal.coin === "USDC-SPOT",
    );
    if (!usdcBalance?.total) return 0;
    const parsed = parseFloat(usdcBalance.total);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [spotState]);

  const isBalanceLoading = from === "perps" ? isLoadingPerps : isLoadingSpot;

  const maxBalance = useMemo(
    () => (from === "perps" ? perpsBalance : spotBalance),
    [from, perpsBalance, spotBalance],
  );

  const formattedMaxBalance = useMemo(() => {
    if (isBalanceLoading) return "...";
    return maxBalance.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }, [isBalanceLoading, maxBalance]);

  const to = from === "perps" ? "spot" : "perps";
  const toPerp = from === "spot";

  const toggleSide = () => {
    setFrom((prev) => (prev === "perps" ? "spot" : "perps"));
    setStatus(null);
    setAmount("");
  };

  const handleSetMax = () => {
    if (isBalanceLoading || maxBalance <= 0) return;
    setAmount(maxBalance.toString());
  };

  const handleConfirm = async () => {
    if (!walletAddress) {
      setStatus({
        type: "error",
        message: "Connect your wallet to transfer funds.",
      });
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setStatus({
        type: "error",
        message: "Enter a valid amount.",
      });
      return;
    }

    if (parsedAmount > maxBalance) {
      setStatus({
        type: "error",
        message: "Amount exceeds available balance.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({
      type: "info",
      message: "Generating Hyperliquid signature...",
    });

    try {
      const hyperliquidChain = TESTNET ? "Testnet" : "Mainnet";
      const nonce = BigInt(Date.now());

      const actionForSign = {
        type: "usdClassTransfer",
        hyperliquidChain,
        signatureChainId: ARBITRUM_CHAIN_ID_HEX,
        amount: parsedAmount.toString(),
        toPerp,
        nonce,
      };

      const domain = {
        name: "HyperliquidSignTransaction",
        version: "1",
        chainId: ARBITRUM_CHAIN_ID,
        verifyingContract:
          "0x0000000000000000000000000000000000000000" as const,
      };

      const types = {
        "HyperliquidTransaction:UsdClassTransfer": [
          { name: "hyperliquidChain", type: "string" },
          { name: "amount", type: "string" },
          { name: "toPerp", type: "bool" },
          { name: "nonce", type: "uint64" },
        ],
      } as const;

      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: "HyperliquidTransaction:UsdClassTransfer",
        message: actionForSign,
      });

      const sigHex = (
        isHex(signature) ? signature : `0x${signature}`
      ) as `0x${string}`;
      const parsedSig = parseSignature(sigHex);
      const r = parsedSig.r;
      const s = parsedSig.s;
      let v = Number(parsedSig.v);
      if (v === 0 || v === 1) {
        v += 27;
      }

      const actionPayload = {
        ...actionForSign,
        nonce: Number(actionForSign.nonce),
      };

      const payload = {
        action: actionPayload,
        nonce: actionPayload.nonce,
        signature: { r, s, v },
      };

      const response = await fetch(EXCHANGE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || result?.status !== "ok") {
        throw new Error(
          result?.response ||
            result?.error ||
            result?.message ||
            "Transfer failed. Please try again shortly.",
        );
      }

      setStatus({
        type: "success",
        message: `Transferred ${parsedAmount} USDC from ${from} to ${to}.`,
      });
      setAmount("");

      invalidateClearinghouseState(walletAddress);
      invalidateSpotClearinghouseState(walletAddress);
    } catch (error) {
      console.error("P<->S transfer failed:", error);
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unexpected error while transferring.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const disableConfirm = !amount || isSubmitting || !walletAddress;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-default max-w-137.5 p-6">
        <div className="">
          <DialogTitle className="!text-heading-sm-semibold mb-6 text-left text-neutral-50">
            Transfer USDC
          </DialogTitle>

          <div className="mb-3 flex items-center justify-between">
            <p className="text-body-md-regular max-w-xs text-left text-neutral-50">
              Move USDC funds between your <br />
              Spot and Perps accounts.
            </p>

            <div className="flex items-center justify-center gap-3 transition select-none hover:opacity-80">
              <div
                onClick={toggleSide}
                className="bg-surface-secondary flex cursor-pointer items-center justify-center gap-3 rounded-lg p-2"
              >
                <span className="text-button-lg-medium text-neutral-50 capitalize">
                  {from}
                </span>

                <span className="text-button-lg-medium text-primary-500">
                  ⇄
                </span>

                <span className="text-button-lg-medium text-neutral-50 capitalize">
                  {to}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Input
                type="text"
                className="bg-surface-subtle focus:border-primary-500 text-body-lg-regular placeholder:text-body-lg-regular w-full rounded-lg border border-neutral-800 px-4 py-3 pr-32 text-neutral-50 transition placeholder:text-neutral-600 focus:shadow-[0_0_0_3px_rgba(0,157,77,0.15)] focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Amount"
                value={amount}
                onChange={(e) => {
                  setStatus(null);
                  setAmount(e.target.value);
                }}
              />
              <button
                type="button"
                onClick={handleSetMax}
                disabled={isBalanceLoading || maxBalance <= 0}
                className="text-body-lg-medium text-primary-500 absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-md"
              >
                MAX: {formattedMaxBalance}
              </button>
            </div>
          </div>

          {status && (
            <p
              className={`text-body-sm-regular absolute top-64.75 ${
                status.type === "error"
                  ? "text-red-500"
                  : status.type === "success"
                    ? "text-emerald-400"
                    : "text-neutral-300"
              }`}
            >
              {status.message}
            </p>
          )}
          {!isEnableTrading ? (
            <div className="w-full">
              <ButtonCustom
                onClick={onEnableTrading}
                colorSchema="primary"
                size="lg"
                rounded="md"
              >
                Establish Connection
              </ButtonCustom>
            </div>
          ) : (
            <div className="w-full">
              <ButtonCustom
                onClick={handleConfirm}
                disabled={disableConfirm}
                isLoading={isSubmitting}
                colorSchema="primary"
                size="lg"
                rounded="md"
              >
                {isSubmitting ? "Processing..." : "Confirm"}
              </ButtonCustom>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PsDialogContent;
