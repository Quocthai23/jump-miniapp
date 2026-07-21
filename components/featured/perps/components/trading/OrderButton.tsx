import { useTrading } from "@/hooks/useTrading";
import { fromDisplayToSymbol } from "@/utils/displayCoin";
import { useAccount } from "wagmi";

interface OrderButtonProps {
  isEnableTrading: boolean;
  isLoading: boolean;
  sdkWithAgent: boolean;
  coin: string;
  onEnableTrading: () => void;
  onPlaceOrder: (isBuy: boolean) => void;
  isDisable?: boolean;
  buttonContent?: string;
  isClosePosition?: boolean;
  isReversePosition?: boolean;
}

/**
 * Button to enable trading or place orders
 */
export function OrderButton({
  isEnableTrading,
  isLoading,
  sdkWithAgent,
  coin,
  onEnableTrading,
  onPlaceOrder,
  buttonContent,
  isDisable,
  isClosePosition,
  isReversePosition,
}: OrderButtonProps) {
  const { form, context } = useTrading();
  const { isConnected } = useAccount();

  const getLoadingText = () => {
    if (isReversePosition) return "Reversing...";
    if (isClosePosition) return "Closing position...";
    return "Placing order...";
  };

  // Validate scale order inputs
  // If not connected, show Connect Wallet button
  if (!isConnected) {
    return <span className="text-button-md">Connect Wallet</span>;
  }

  if (!isEnableTrading) {
    return (
      <>
        <button
          onClick={onEnableTrading}
          disabled={isLoading || !sdkWithAgent}
          className={`w-full ${context.activeTab === "long" ? "bg-primary-500 border-primary-500 hover:bg-primary-500 active:bg-primary-700 active:border-primary-500" : "border-red-500 bg-red-700 hover:border-red-500 hover:bg-red-500 active:border-red-500 active:bg-red-700"} disabled:bg-neutral-disabled rounded-md py-2 text-neutral-50 transition-all disabled:cursor-not-allowed bg-red-500`}
        >
          {isLoading ? (
            <span className="text-body-sm-medium md:text-body-md-medium flex items-center justify-center">
              <svg
                className="mr-3 -ml-1 h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Enabling...
            </span>
          ) : (
            <span className="text-body-sm-medium md:text-body-md-medium">
              Enable Trading
            </span>
          )}
        </button>
      </>
    );
  }

  return (
    <button
      onClick={() => onPlaceOrder(context.activeTab === "long")}
      disabled={isLoading || !sdkWithAgent || isDisable}
      className={`w-full ${
        isClosePosition || isReversePosition
          ? "bg-[#0187FF] disabled:bg-[#70afe7] text-neutral-50"
          : context.activeTab === "long"
            ? "bg-[#12b76a] border-primary-500 disabled:bg-[#63c999]  text-neutral-50"
            : "bg-[#F04438] text-neutral-50 disabled:bg-[#e37a73]"
      } body-subtitle-semibold rounded-full py-3 transition-all `}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg
            className="mr-3 -ml-1 h-5 w-5 animate-spin text-neutral-50"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {getLoadingText()}
        </span>
      ) : buttonContent ? (
        buttonContent
      ) : isClosePosition ? (
        "Close position"
      ) : isReversePosition ? (
        "Reverse"
      ) : (
        `${context.activeTab === "long" ? "Long" : "Short"} ${fromDisplayToSymbol(coin)}`
      )}
    </button>
  );
}
