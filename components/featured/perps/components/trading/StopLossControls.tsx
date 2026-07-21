import { useState } from "react";
import { Input } from "packages/ui/src/components/shared/atoms/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "packages/ui/src/components/shared/atoms/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "packages/ui/src/components/shared/atoms/tooltip";
import { InputCustom } from "@/components/featured/share/input";
import { useOrderFormStore } from "@/state/trading";

type PositionTab = "long" | "short";

interface StopLossControlsProps {
  activeTab: PositionTab;
  lossDollarDisabled: boolean;
  lossValue: string;
  onLossChange: (value: string) => void;
  lossInputType: "$" | "%";
  setLossInputType: (type: "$" | "%") => void;
  slOrderSizeError?: string | null;
  slPnlPercent?: number | null;
  isUpdatingSlFromLoss: React.MutableRefObject<boolean>;
  isUpdatingLossFromSl: React.MutableRefObject<boolean>;
  setLossValue: (value: string) => void;
  baseEntryPrice: number;
  marginUsed: number;
  positionSize: number;
  leverage: number;
  hasOrderSize: boolean;
  gainValue: string;
  gainInputType: "$" | "%";
  setGainInputType: (type: "$" | "%") => void;
  setGainValue: (value: string) => void;
  setTpValue: (value: string) => void;
  setSlValue: (value: string) => void;
  computeLossPercentFromPrices: (
    slPrice: number,
    baseEntryPrice: number,
    activeTab: PositionTab,
    leverage: number,
  ) => number | null;
}

export function StopLossControls({
  activeTab,
  lossDollarDisabled,
  lossValue,
  onLossChange,
  lossInputType,
  setLossInputType,
  slOrderSizeError,
  slPnlPercent,
  isUpdatingSlFromLoss,
  isUpdatingLossFromSl,
  setLossValue,
  baseEntryPrice,
  positionSize,
  marginUsed,
  leverage,
  hasOrderSize,
  gainValue,
  gainInputType,
  setGainInputType,
  setGainValue,
  setTpValue,
  setSlValue,
  computeLossPercentFromPrices,
}: StopLossControlsProps) {
  const [slFocused, setSlFocused] = useState(false);
  const [lossFocused, setLossFocused] = useState(false);

  const {
    slInputType,
    slValue,
    setSlInputType: setSlInputTypeFromStore,
  } = useOrderFormStore();

  const handleSlPriceChange = (value: string) => {
    setSlValue(value);

    if (!value || value.trim() === "") {
      if (!isUpdatingSlFromLoss) {
        setLossValue("");
      }
      return;
    }

    if (
      slInputType === "price" &&
      baseEntryPrice > 0 &&
      !isUpdatingSlFromLoss.current
    ) {
      const slPrice = parseFloat(value);

      if (!isNaN(slPrice) && baseEntryPrice > 0) {
        isUpdatingLossFromSl.current = true;

        if (positionSize > 0 && marginUsed > 0) {
          const lossDollarSigned =
            activeTab === "long"
              ? (slPrice - baseEntryPrice) * positionSize
              : (baseEntryPrice - slPrice) * positionSize;
          const lossDollar = Math.abs(lossDollarSigned);

          const lossPercent = (lossDollar / marginUsed) * 100;

          if (lossInputType === "$") {
            setLossValue(lossDollar.toFixed(2));
          } else {
            setLossValue(lossPercent.toFixed(2));
          }
        } else {
          const lossPercent = computeLossPercentFromPrices(
            slPrice,
            baseEntryPrice,
            activeTab,
            leverage,
          );

          if (lossInputType === "$") {
            setLossValue("0.00");
          } else if (lossPercent !== null) {
            setLossValue(lossPercent.toFixed(2));
          }
        }

        setTimeout(() => {
          isUpdatingLossFromSl.current = false;
        }, 0);
      } else {
        setLossValue("");
      }
    } else if (slInputType === "offset" && value) {
      setLossValue(value);
    }
  };

  const handleLossInputTypeChange = (newType: "$" | "%") => {
    setLossInputType(newType);
    setGainInputType(newType);

    if (newType === "$" && !hasOrderSize) {
      setGainValue("");
      setTpValue("");
      setLossValue("");
      setSlValue("");
      return;
    }

    if (lossValue) {
      const lossInput = parseFloat(lossValue);
      if (!isNaN(lossInput) && baseEntryPrice > 0 && positionSize > 0) {
        let newLossValue: string;
        if (newType === "$" && lossInputType === "%") {
          const lossDollar = (lossInput * marginUsed) / 100;
          newLossValue = lossDollar.toFixed(2);
        } else if (newType === "%" && lossInputType === "$") {
          const lossPercent =
            marginUsed > 0 ? (lossInput / marginUsed) * 100 : 0;
          newLossValue = lossPercent.toFixed(2);
        } else {
          newLossValue = lossValue;
        }
        setLossValue(newLossValue);
      }
    }

    if (gainValue) {
      const gainInput = parseFloat(gainValue);
      if (!isNaN(gainInput) && baseEntryPrice > 0 && positionSize > 0) {
        let newGainValue: string;
        if (newType === "$" && gainInputType === "%") {
          const gainDollar = (gainInput * marginUsed) / 100;
          newGainValue = gainDollar.toFixed(2);
        } else if (newType === "%" && gainInputType === "$") {
          const gainPercent =
            marginUsed > 0 ? (gainInput / marginUsed) * 100 : 0;
          newGainValue = gainPercent.toFixed(2);
        } else {
          newGainValue = gainValue;
        }
        setGainValue(newGainValue);
      }
    }
  };

  const handleSlInputTypeChange = (newType: "price" | "offset") => {
    setSlInputTypeFromStore(newType);

    if (newType === "offset" && slValue) {
      setLossValue(slValue);
    } else if (newType === "price") {
      if (slValue && baseEntryPrice > 0) {
        const slPrice = parseFloat(slValue);
        if (!isNaN(slPrice) && baseEntryPrice > 0) {
          let newLossValue: string;

          if (positionSize > 0 && marginUsed > 0) {
            const pnlDollar =
              activeTab === "long"
                ? (slPrice - baseEntryPrice) * positionSize
                : (baseEntryPrice - slPrice) * positionSize;
            const lossDollar = Math.abs(pnlDollar);
            const lossPercent = (lossDollar / marginUsed) * 100;
            newLossValue =
              lossInputType === "$"
                ? lossDollar.toFixed(2)
                : lossPercent.toFixed(2);
          } else {
            const lossPercent = computeLossPercentFromPrices(
              slPrice,
              baseEntryPrice,
              activeTab,
              leverage,
            );
            newLossValue =
              lossInputType === "$" || lossPercent === null
                ? "0.00"
                : lossPercent.toFixed(2);
          }

          setLossValue(newLossValue);
        } else {
          setLossValue("");
        }
      } else {
        setLossValue("");
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex w-full flex-col">
              <InputCustom
                type="text"
                inputMode="decimal"
                placeholder={slInputType === "price" ? "SL Price" : "SL Offset"}
                value={slValue}
                onChange={(e) => handleSlPriceChange(e.target.value)}
                onFocus={() => setSlFocused(true)}
                onBlur={() => setSlFocused(false)}
                disabled={lossDollarDisabled}
                className={`text-body-md-regular rounded-lg border bg-transparent p-2 transition-all duration-200 ${
                  slFocused
                    ? activeTab === "long"
                      ? "focus-within:border-primary-500! focus-within:shadow-[0_0_0_3px_rgba(0,157,77,0.15)]"
                      : "focus-within:border-red-500! focus-within:shadow-[0_0_0_3px_rgba(230,80,108,0.15)]"
                    : "border-neutral-500"
                } disabled:cursor-not-allowed`}
              />
              {slOrderSizeError && slInputType === "price" && (
                <div className="mt-1 text-xs text-red-400">
                  {slOrderSizeError}
                </div>
              )}
              {!slOrderSizeError &&
                slPnlPercent !== null &&
                slPnlPercent !== undefined && (
                  <div className="mt-1 text-xs text-red-400">
                    {slPnlPercent > 0 ? "+" : ""}
                    {slPnlPercent.toFixed(2)}% PnL
                  </div>
                )}
            </div>
          </TooltipTrigger>
          {lossDollarDisabled && (
            <TooltipContent
              side="top"
              className="border-neutral-800 bg-neutral-900 text-neutral-200"
            >
              Must specify order size
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`h-9 w-26.5 rounded-lg border p-2 text-neutral-300 transition-all duration-200 hover:border-neutral-300 ${
                lossFocused
                  ? activeTab === "long"
                    ? "focus-within:border-primary-500! focus-within::shadow-[0_0_0_3px_rgba(0,157,77,0.15)]"
                    : "focus-within::shadow-[0_0_0_3px_rgba(230,80,108,0.15)] focus-within:border-red-500!"
                  : "border-neutral-500"
              }`}
            >
              <div
                className={`flex w-auto items-center gap-3 rounded-lg px-1 text-neutral-300 data-[state=open]:border ${
                  activeTab === "long"
                    ? "data-[state=open]:border-[#11601c]"
                    : "data-[state=open]:border-red-500"
                } `}
              >
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Loss"
                  value={lossValue}
                  onChange={(e) => onLossChange(e.target.value)}
                  onFocus={() => setLossFocused(true)}
                  onBlur={() => setLossFocused(false)}
                  disabled={lossDollarDisabled}
                  className="text-body-md-regular h-4.5 w-12 border-none bg-transparent p-0 text-neutral-300 shadow-none placeholder:text-neutral-600 focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none disabled:cursor-not-allowed"
                />

                {slInputType === "price" && (
                  <Select
                    value={lossInputType}
                    onValueChange={(value) =>
                      handleLossInputTypeChange(value as "$" | "%")
                    }
                  >
                    <SelectTrigger className="h-4.5 w-auto border-none bg-transparent px-1 text-neutral-50 focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="%" className="text-[14px]" />
                    </SelectTrigger>

                    <SelectContent className="w-fit min-w-0 border-neutral-500 bg-[#1D2621]">
                      <SelectItem value="$">
                        <p className="text-[14px]">$</p>
                      </SelectItem>

                      <SelectItem value="%">
                        <p className="text-[14px]">%</p>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Select
                  value={slInputType}
                  onValueChange={(value) =>
                    handleSlInputTypeChange(value as "price" | "offset")
                  }
                >
                  <SelectTrigger className="h-4.5 w-auto border-none bg-transparent px-1 text-neutral-50 focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="%" className="text-[14px]" />
                  </SelectTrigger>

                  <SelectContent className="w-fit min-w-0 border-neutral-500 bg-[#1D2621]">
                    <SelectItem
                      value="price"
                      className="text-neutral-tertiary cursor-pointer justify-center"
                    >
                      <p className="text-[14px]">$</p>
                    </SelectItem>

                    <SelectItem
                      value="offset"
                      className="text-neutral-tertiary cursor-pointer justify-center"
                    >
                      <p className="text-[14px]">%</p>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TooltipTrigger>
          {lossDollarDisabled && (
            <TooltipContent
              side="top"
              className="border-neutral-800 bg-neutral-900 text-neutral-200"
            >
              Must specify order size
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
