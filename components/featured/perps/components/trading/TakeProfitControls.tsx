import { useRef, useState } from "react";
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
import { OrderTab } from "@/state/trading/orderFormStore";

type PositionTab = "long" | "short";

interface TakeProfitControlsProps {
  activeTab: PositionTab;
  tpInputType: "price" | "offset";
  tpValue: string;
  gainDollarDisabled: boolean;
  gainValue: string;
  onGainChange: (value: string) => void;
  gainInputType: "$" | "%";
  setGainInputType: (type: "$" | "%") => void;
  setTpValue: (value: string) => void;
  setTpInputType: (type: "price" | "offset") => void;
  setGainValue: (value: string) => void;
  baseEntryPrice: number;
  marginUsed: number;
  positionSize: number;
  orderSize: string;
  orderTab: OrderTab;
  currentCoin: string;
  leverage: number;
  hasOrderSize: boolean;
  lossValue: string;
  lossInputType: "$" | "%";
  setLossValue: (value: string) => void;
  setLossInputType: (type: "$" | "%") => void;
  setSlValue: (value: string) => void;
  computeGainPercentFromPrices: (
    tpPrice: number,
    baseEntryPrice: number,
    activeTab: PositionTab,
    leverage: number,
  ) => number | null;
  isUpdatingTpFromGain: React.MutableRefObject<boolean>;
  isUpdatingGainFromTp: React.MutableRefObject<boolean>;
}

export function TakeProfitControls({
  activeTab,
  tpInputType,
  tpValue,
  gainDollarDisabled,
  gainValue,
  onGainChange,
  gainInputType,
  setGainInputType,
  setTpValue,
  setTpInputType,
  setGainValue,
  baseEntryPrice,
  marginUsed,
  positionSize,
  orderSize,
  orderTab,
  currentCoin,
  leverage,
  hasOrderSize,
  lossValue,
  lossInputType,
  setLossValue,
  setLossInputType,
  setSlValue,
  computeGainPercentFromPrices,
  isUpdatingTpFromGain,
  isUpdatingGainFromTp,
}: TakeProfitControlsProps) {
  const [tpFocused, setTpFocused] = useState(false);
  const [gainFocused, setGainFocused] = useState(false);

  const handleTpPriceChange = (value: string) => {
    setTpValue(value);

    if (!value || value.trim() === "") {
      if (!isUpdatingTpFromGain.current) {
        setGainValue("");
      }
      return;
    }

    if (
      tpInputType === "price" &&
      baseEntryPrice > 0 &&
      !isUpdatingTpFromGain.current
    ) {
      const tpPrice = parseFloat(value);

      if (!isNaN(tpPrice) && baseEntryPrice > 0) {
        isUpdatingGainFromTp.current = true;

        let calculatedMarginUsed = marginUsed;
        let calculatedPositionSize = positionSize;

        if (calculatedMarginUsed <= 0 || calculatedPositionSize <= 0) {
          const size = parseFloat(orderSize || "0");
          if (size > 0 && baseEntryPrice > 0) {
            if (orderTab === "limit" || currentCoin === "USDC") {
              calculatedPositionSize = size / baseEntryPrice;
            } else {
              calculatedPositionSize = size;
            }

            if (calculatedPositionSize > 0 && leverage > 0) {
              const positionValue = calculatedPositionSize * baseEntryPrice;
              calculatedMarginUsed = positionValue / leverage;
            }
          }
        }

        if (calculatedPositionSize > 0 && calculatedMarginUsed > 0) {
          const gainDollar =
            activeTab === "long"
              ? (tpPrice - baseEntryPrice) * calculatedPositionSize
              : (baseEntryPrice - tpPrice) * calculatedPositionSize;
          const gainPercent = (gainDollar / calculatedMarginUsed) * 100;

          if (gainInputType === "$") {
            setGainValue(gainDollar.toFixed(2));
          } else {
            setGainValue(gainPercent.toFixed(2));
          }
        } else {
          const gainPercent = computeGainPercentFromPrices(
            tpPrice,
            baseEntryPrice,
            activeTab,
            leverage,
          );

          if (gainInputType === "$") {
            setGainValue("0.00");
          } else if (gainPercent !== null) {
            setGainValue(gainPercent.toFixed(2));
          }
        }

        setTimeout(() => {
          isUpdatingGainFromTp.current = false;
        }, 0);
      } else {
        setGainValue("");
      }
    } else if (tpInputType === "offset" && value) {
      setGainValue(value);
    }
  };

  const handleGainInputTypeChange = (newType: "$" | "%") => {
    setGainInputType(newType);
    setLossInputType(newType);

    if (newType === "$" && !hasOrderSize) {
      setGainValue("");
      setTpValue("");
      setLossValue("");
      setSlValue("");
      return;
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

    if (lossValue) {
      const lossInput = parseFloat(lossValue);
      if (!isNaN(lossInput) && baseEntryPrice > 0 && positionSize > 0) {
        let newLossValue: string;
        if (newType === "$" && lossInputType === "%") {
          const lossDollar = (Math.abs(lossInput) * marginUsed) / 100;
          newLossValue = lossDollar.toFixed(2);
        } else if (newType === "%" && lossInputType === "$") {
          const lossPercent =
            marginUsed > 0 ? (Math.abs(lossInput) / marginUsed) * 100 : 0;
          newLossValue = lossPercent.toFixed(2);
        } else {
          newLossValue = lossValue;
        }
        setLossValue(newLossValue);
      }
    }
  };

  const handleTpInputTypeChange = (newType: "price" | "offset") => {
    setTpInputType(newType);

    if (newType === "offset" && tpValue) {
      setGainValue(tpValue);
    } else if (newType === "price") {
      if (tpValue && baseEntryPrice > 0) {
        const tpPrice = parseFloat(tpValue);
        if (!isNaN(tpPrice) && baseEntryPrice > 0) {
          let newGainValue: string;

          if (positionSize > 0 && marginUsed > 0) {
            const gainDollar =
              activeTab === "long"
                ? (tpPrice - baseEntryPrice) * positionSize
                : (baseEntryPrice - tpPrice) * positionSize;
            const gainPercent = (gainDollar / marginUsed) * 100;
            newGainValue =
              gainInputType === "$"
                ? gainDollar.toFixed(2)
                : gainPercent.toFixed(2);
          } else {
            const gainPercent = computeGainPercentFromPrices(
              tpPrice,
              baseEntryPrice,
              activeTab,
              leverage,
            );
            newGainValue =
              gainInputType === "$" || gainPercent === null
                ? "0.00"
                : gainPercent.toFixed(2);
          }

          setGainValue(newGainValue);
        } else {
          setGainValue("");
        }
      } else {
        setGainValue("");
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <InputCustom
              type="text"
              inputMode="decimal"
              placeholder={tpInputType === "price" ? "TP Price" : "TP Offset"}
              value={tpValue}
              onChange={(e) => handleTpPriceChange(e.target.value)}
              onFocus={() => setTpFocused(true)}
              onBlur={() => setTpFocused(false)}
              disabled={gainDollarDisabled}
              className={`text-body-md-regular rounded-lg border bg-transparent p-2 transition-all duration-200 ${
                tpFocused
                  ? activeTab === "long"
                    ? "focus-within:border-primary-500! focus-within:shadow-[0_0_0_3px_rgba(0,157,77,0.15)]"
                    : "focus-within:border-red-500! focus-within:shadow-[0_0_0_3px_rgba(230,80,108,0.15)]"
                  : "border-neutral-500"
              } disabled:cursor-not-allowed`}
            />
          </TooltipTrigger>
          {gainDollarDisabled && (
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
                gainFocused
                  ? activeTab === "long"
                    ? "focus-within:border-primary-500! focus-within:shadow-[0_0_0_3px_rgba(0,157,77,0.15)]"
                    : "focus-within:border-red-500! focus-within:shadow-[0_0_0_3px_rgba(230,80,108,0.15)]"
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
                  placeholder="Gain"
                  value={gainValue}
                  onChange={(e) => onGainChange(e.target.value)}
                  onFocus={() => setGainFocused(true)}
                  onBlur={() => setGainFocused(false)}
                  disabled={gainDollarDisabled}
                  className="text-body-md-regular h-4.5 w-12 border-none bg-transparent p-0 text-neutral-300 shadow-none placeholder:text-neutral-600 focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none disabled:cursor-not-allowed"
                />

                {tpInputType === "price" && (
                  <Select
                    value={gainInputType}
                    onValueChange={(value) =>
                      handleGainInputTypeChange(value as "$" | "%")
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
                  value={tpInputType}
                  onValueChange={(value) =>
                    setTpInputType(value as "price" | "offset")
                  }
                >
                  <SelectTrigger className="h-4.5 w-auto border-none bg-transparent px-1 text-neutral-50 focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="%" className="text-[14px]" />
                  </SelectTrigger>

                  <SelectContent className="w-fit min-w-0 border-neutral-500 bg-[#1D2621]">
                    <SelectItem value="price">
                      <p className="text-[10px]">$</p>
                    </SelectItem>

                    <SelectItem value="offset">
                      <p className="text-[10px]">%</p>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TooltipTrigger>
          {gainDollarDisabled && (
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
