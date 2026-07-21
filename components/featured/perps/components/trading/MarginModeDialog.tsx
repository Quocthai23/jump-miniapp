import { useEffect, useState } from "react";
import { Button } from "packages/ui/src/components/shared/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "packages/ui/src/components/shared/atoms/dialog";
import { type MarginType, useTradingContextStore } from "@/state/trading";
import { ButtonCustom } from "./ButtonCustom";

interface MarginModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marginType: MarginType;
  setMarginType: (type: MarginType) => void;
  handleAdjustLeverage: (
    leverage: number,
    marginTypeOverride?: MarginType,
  ) => Promise<void>;
  hasSufficientBalance: boolean;
  onlyIsolated: boolean;
  canChangeMarginMode: boolean;
  isEnableTrading: boolean;
  onEnableTrading: () => void;
}

type MarginOptionType = "cross" | "isolated";

interface MarginOptionProps {
  type: MarginOptionType;
  title: string;
  description: string;
}

export function MarginModeDialog({
  open,
  onOpenChange,
  marginType,
  setMarginType,
  handleAdjustLeverage,
  hasSufficientBalance,
  onlyIsolated,
  canChangeMarginMode,
  isEnableTrading,
  onEnableTrading,
}: MarginModeDialogProps) {
  const [selectedType, setSelectedType] =
    useState<MarginOptionType>(marginType);

  const { selectedCoin } = useTradingContextStore();
  const coinDisplay = selectedCoin.replace("-PERP", "-USDC");

  useEffect(() => {
    if (open) {
      const effectiveType: MarginOptionType = onlyIsolated
        ? "isolated"
        : marginType;
      setSelectedType(effectiveType);
    }
  }, [open, marginType, onlyIsolated]);

  const handleSelect = (type: MarginOptionType) => {
    if (onlyIsolated && type === "cross") {
      return;
    }
    if (!canChangeMarginMode) {
      return;
    }
    setSelectedType(type);
  };

  const handleConfirm = async () => {
    setMarginType(selectedType);
    await handleAdjustLeverage(
      useTradingContextStore.getState().leverage,
      selectedType,
    );
    onOpenChange(false);
  };

  const MarginOption = ({ type, title, description }: MarginOptionProps) => {
    const isActive = selectedType === type;
    const isDisabled =
      (onlyIsolated && type === "cross") || !canChangeMarginMode;

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!isDisabled) {
            handleSelect(type);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!isDisabled) {
              handleSelect(type);
            }
          }
        }}
        className={`w-full rounded-md border px-4 py-3 text-left transition-colors ${
          isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        } ${
          isActive && !isDisabled
            ? "bg-primary-600/30 border-primary-700/15 hover:bg-primary-600/30 hover:border-primary-700/15 border-none"
            : !isActive && !isDisabled
              ? "hover:bg-primary-600/30 hover:border-primary-700/15 border-none"
              : "border-none"
        }`}
      >
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-sm border transition-colors ${
                isActive
                  ? "border-primary-500 bg-neutral-900"
                  : "border-neutral-500"
              }`}
            >
              {isActive && (
                <span className="bg-primary-500 h-3 w-3 rounded-xs" />
              )}
            </span>
            <p className="text-body-md-medium text-neutral-50">{title}</p>
          </div>

          <div>
            <p className="text-body-sm-medium text-neutral-300">
              {description}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-subtle w-full max-w-xl rounded-lg border-none p-0 text-neutral-50">
        <DialogHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-4">
          <DialogTitle>
            <p className="text-heading-xs-semibold text-neutral-50">
              {coinDisplay} Margin Mode
            </p>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-6">
          <div className="space-y-4">
            <MarginOption
              type="cross"
              title="Cross"
              description="All cross positions use a shared margin as collateral. If liquidation occurs, your cross margin and any remaining positions may be lost."
            />
            <MarginOption
              type="isolated"
              title="Isolated"
              description="Limit risk per position by allocating margin individually. If an isolated position hits 100% margin usage, it will be liquidated. You can add or remove margin for each position in this mode."
            />
          </div>

          {!isEnableTrading ? (
            <div>
              <ButtonCustom
                onClick={onEnableTrading}
                colorSchema="primary"
                size="md"
                rounded="md"
              >
                Establish Connection
              </ButtonCustom>
            </div>
          ) : (
            <>
              <Button
                type="button"
                className="bg-primary-500 text-button-md hover:bg-primary-500/90 disabled:bg-primary-900 disabled:text-primary-800 disabled:border-primary-900 w-full rounded-md text-neutral-50 disabled:cursor-not-allowed"
                disabled={!hasSufficientBalance || !canChangeMarginMode}
                onClick={handleConfirm}
              >
                {!hasSufficientBalance
                  ? "Need to Deposit"
                  : !canChangeMarginMode
                    ? "Close position to change mode"
                    : "Confirm"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
