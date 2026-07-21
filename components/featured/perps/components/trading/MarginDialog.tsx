import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "packages/ui/src/components/shared/atoms/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "packages/ui/src/components/shared/atoms/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "packages/ui/src/components/shared/atoms/select";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useHyperliquid } from "@/contexts/HyperliquidContext";
import { formatPrice } from "@/utils/price";
import { getAgentAddress } from "@/utils/getAgentData";
import { useClearinghouseState } from "@/hooks/useHyperliquidQueries";
import { ButtonCustom } from "./ButtonCustom";
import { fromDisplayToSymbol } from "@/utils/displayCoin";

interface MarginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: {
    coin: string;
    size: string;
    entryPx: string;
    unrealizedPnl: string;
    positionValue: string;
    leverage?: {
      value: number;
      type: string;
    };
  } | null;
  walletAddress: string | null;
  isEnableTrading: boolean;
  handleEnableTrading: () => void;
}

export function MarginDialog({
  open,
  onOpenChange,
  position,
  walletAddress,
  isEnableTrading,
  handleEnableTrading,
}: MarginDialogProps) {
  const [marginAmount, setMarginAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [operation, setOperation] = useState<"add" | "remove">("add");
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const { getTradingSdk } = useHyperliquid();
  const { openConnectModal } = useConnectModal();

  const { data: clearinghouseState } = useClearinghouseState(
    walletAddress || undefined,
    !!walletAddress,
  );

  const availableMargin = useMemo(() => {
    if (!clearinghouseState?.withdrawable) return 0;
    return parseFloat(clearinghouseState.withdrawable);
  }, [clearinghouseState]);

  const currentMargin = useMemo(() => {
    if (!clearinghouseState?.assetPositions || !position?.coin) return 0;

    const assetPosition = clearinghouseState.assetPositions.find(
      (ap: any) => ap.position?.coin === position.coin,
    );

    if (!assetPosition?.position?.marginUsed) return 0;
    return parseFloat(assetPosition.position.marginUsed);
  }, [clearinghouseState, position]);

  const initialMarginRequired = useMemo(() => {
    if (!clearinghouseState?.assetPositions || !position?.coin) return 0;

    const assetPosition = clearinghouseState.assetPositions.find(
      (ap: any) => ap.position?.coin === position.coin,
    );

    if (!assetPosition?.position) return 0;

    const positionValue = parseFloat(
      assetPosition.position.positionValue || "0",
    );
    const currentLeverage = assetPosition.position.leverage?.value || 1;

    if (positionValue <= 0 || currentLeverage <= 0) return 0;

    return positionValue / currentLeverage;
  }, [clearinghouseState, position]);

  const maxAmount = useMemo(() => {
    if (!walletAddress) return 0;
    if (operation === "add") {
      return availableMargin || 0;
    } else {
      const maxRemovable = currentMargin - initialMarginRequired;
      return maxRemovable > 0.01 ? maxRemovable : 0;
    }
  }, [
    operation,
    availableMargin,
    currentMargin,
    initialMarginRequired,
    walletAddress,
  ]);

  const handleClose = () => {
    onOpenChange(false);
    setMarginAmount("");
    setOperation("add");
  };

  const handleMaxClick = () => {
    setMarginAmount(maxAmount.toFixed(2));
  };

  const handleAdjustMargin = async () => {
    if (!position || !marginAmount || !walletAddress) return;

    const agentInfo = getAgentAddress(walletAddress);
    if (!agentInfo || !agentInfo.privateKey) {
      console.error("Agent not approved. Please enable trading first.");
      return;
    }

    try {
      setIsLoading(true);
      handleClose();
    } catch (error) {
      console.error("Failed to adjust margin:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isValidAmount = useMemo(() => {
    if (!marginAmount) return false;
    const amount = parseFloat(marginAmount);
    return !isNaN(amount) && amount > 0 && amount <= maxAmount;
  }, [marginAmount, maxAmount]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-subtle border-border-neutral-default w-full max-w-137.5 space-y-6 rounded-lg border p-6 shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-heading-sm-semibold text-neutral-50">
            Adjust Margin
          </DialogTitle>
        </DialogHeader>

        {position && (
          <div className="space-y-3">
            <div className="flex items-center gap-12">
              <p className="text-body-md-regular text-neutral-50">
                Add margin to lower liquidation risk, or remove excess margin
                for use elsewhere.
              </p>

              {walletAddress && (
                <div className="flex-1">
                  <Select
                    value={operation}
                    onValueChange={(value: "add" | "remove") =>
                      setOperation(value)
                    }
                    onOpenChange={setIsSelectOpen}
                  >
                    <SelectTrigger className="bg-surface-secondary relative h-10 w-auto border-none text-neutral-50 focus:ring-0 focus:ring-offset-0 focus:outline-none [&>svg]:hidden">
                      <SelectValue>
                        {operation === "add" ? "Add" : "Remove"}
                      </SelectValue>
                      <span className="pointer-events-none mt-4.5 ml-1 -translate-y-1/2">
                        {isSelectOpen ? (
                          <ChevronUp className="h-4 w-4 opacity-50" />
                        ) : (
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        )}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="bg-surface-default border-neutral-600">
                      <SelectItem value="add" className="text-neutral-50">
                        Add
                      </SelectItem>
                      <SelectItem value="remove" className="text-neutral-50">
                        Remove
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {walletAddress && (
              <div className="flex items-end gap-2">
                <div
                  className={`bg-surface-subtle relative flex-1 rounded-md border p-2 transition-all duration-200 ${
                    isAmountFocused
                      ? "border-primary-500 shadow-[0_0_0_3px_rgba(0,157,77,0.15)]"
                      : "border-neutral-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-1 items-center justify-start gap-1 overflow-hidden pr-20">
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="Amount"
                        value={marginAmount}
                        onChange={(e) => setMarginAmount(e.target.value)}
                        onFocus={() => setIsAmountFocused(true)}
                        onBlur={() => setIsAmountFocused(false)}
                        disabled={isLoading}
                        className={`text-body-lg-regular! h-auto min-w-0 flex-1 [appearance:textfield] border-0! bg-transparent p-1 text-left text-neutral-50 shadow-none outline-none focus:border-0! focus:ring-0! focus-visible:ring-0! focus-visible:ring-offset-0! [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                          !isAmountFocused ? "placeholder-neutral-600" : ""
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    className="text-body-lg-medium! text-primary-500 hover:text-primary-400 absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer"
                  >
                    Max: ${formatPrice(maxAmount.toString())}
                  </button>
                </div>
              </div>
            )}

            {walletAddress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-body-lg-regular text-neutral-300">
                    Current margin for {fromDisplayToSymbol(position.coin)}
                  </span>
                  <span className="text-body-lg-medium text-neutral-50">
                    {formatPrice(currentMargin.toString())} USDC
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-body-lg-regular text-neutral-300">
                    Margin available to add
                  </span>
                  <span className="text-body-lg-medium text-neutral-50">
                    {formatPrice(availableMargin.toString())} USDC
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <>
                {!isEnableTrading ? (
                  <ButtonCustom
                    onClick={handleEnableTrading}
                    colorSchema="primary"
                    size="lg"
                    rounded="md"
                  >
                    Establish Connection
                  </ButtonCustom>
                ) : (
                  <>
                    {!walletAddress ? (
                      <ButtonCustom
                        onClick={openConnectModal}
                        colorSchema="primary"
                        size="lg"
                        rounded="md"
                      >
                        Connect Wallet
                      </ButtonCustom>
                    ) : (
                      <ButtonCustom
                        onClick={handleAdjustMargin}
                        disabled={!isValidAmount || isLoading}
                        colorSchema="primary"
                        size="lg"
                        rounded="md"
                      >
                        {isLoading ? "Adjusting..." : "Confirm"}
                      </ButtonCustom>
                    )}
                  </>
                )}
              </>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
