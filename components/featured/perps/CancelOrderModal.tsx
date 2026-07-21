import { useEnableTrading } from "@/components/featured/perps/hooks/useEnableTrading";
import { useHyperliquid } from "@/contexts/HyperliquidContext";
import { useInvalidateHyperliquidQueries } from "@/hooks/useHyperliquidQueries";
import { getAgentAddress } from "@/utils/getAgentData";
import { ChevronLeft } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import type { OrderItem } from "./OrderModal";
import TokenImage from "./TokenImage";

interface CancelOrderModalProps {
  order: OrderItem | null;
  isOpen?: boolean;
  onClose?: () => void;
  onBack?: () => void;
  onCancelOrder?: (order: OrderItem) => void;
  isLoading?: boolean;
}

export const CancelOrderModal = memo(
  ({
    order,
    isOpen = false,
    onClose,
    onBack,
    onCancelOrder,
    isLoading = false,
  }: CancelOrderModalProps) => {
    if (!isOpen || !order) return null;
    const { address: walletAddress } = useAccount();
    const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(
      null,
    );
    const { handleEnableTrading } = useEnableTrading();
    const { getTradingSdk } = useHyperliquid();
    const { invalidateUserOpenOrders } = useInvalidateHyperliquidQueries();

    // Check if trading is enabled
    const isTradingEnabled = useMemo(() => {
      if (!walletAddress) return false;
      const agentInfo = getAgentAddress(walletAddress);
      return !!agentInfo && !!agentInfo.privateKey;
    }, [walletAddress]);

    const getOrderTypeDisplay = () => {
      const type = order.displayOrderType || "Order";
      const side = order.displaySide || "";
      return `${type} ${side}`.trim();
    };

    const handleCancelOrder = async () => {
      if (!order || !order.coin || !order.oid) {
        console.error("Missing order data");
        return;
      }

      if (!walletAddress) {
        alert("Wallet address required");
        return;
      }

      const agentInfo = getAgentAddress(walletAddress);
      if (!agentInfo || !agentInfo.privateKey) {
        alert("Agent not approved. Please enable trading first.");
        return;
      }

      setCancellingOrderId(order.oid);

      try {
        const tradingSdk = await getTradingSdk(
          agentInfo.privateKey,
          agentInfo.userAddress,
        );

        const cancelRequest = {
          coin: order.coin,
          o: order.oid,
        };

        const response = await tradingSdk.exchange.cancelOrder(cancelRequest);
        if (response.status === "ok") {
          await invalidateUserOpenOrders(walletAddress);
          onClose?.();
        } else {
          alert(`Failed to cancel order: ${JSON.stringify(response)}`);
        }
      } catch (error) {
        console.error("Error cancelling order:", error);
        alert(
          `Error cancelling order: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        setCancellingOrderId(null);
      }
    };
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white w-full h-full overflow-hidden flex flex-col py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-10 px-4">
            <ChevronLeft
              width={22}
              height={22}
              className="text-primary-primary cursor-pointer"
              onClick={onBack}
            />
            <span className="body-subtitle-semibold text-primary-primary">
              {getOrderTypeDisplay()}
            </span>
            <div className="w-6" />
          </div>

          <div className="flex-1 overflow-y-auto px-4">
            <div className="flex flex-col items-center mb-8">
              <TokenImage
                symbol={order.displayCoin}
                size={60}
                alt={order.displayCoin}
                className="h-16 w-16 rounded-full mb-2"
              />
              <h2 className="body-subtitle-semibold text-primary-primary">
                {order.displayCoin}
              </h2>
            </div>

            <div className=" p-4 surface-page-background rounded-[12px] shadow-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-border-secondary ">
                  <span className="body-body-regular text-primary-secondary">
                    Date
                  </span>
                  <span className="text-primary-primary body-body-semibold">
                    {order.displayTime || "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-border-secondary ">
                  <div className="flex items-center gap-2">
                    <span className="body-body-regular text-primary-secondary">
                      Limit Price
                    </span>
                  </div>
                  <span className="body-body-semibold text-primary-primary">
                    ${order.displayPrice || "-"}
                  </span>
                </div>

                {/* Funding Rate */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="body-body-regular text-primary-secondary">
                      Size
                    </span>
                  </div>
                  <span className="body-body-semibold text-primary-primary">
                    {order.displaySize} {order.displayCoin} • $
                    {order.displayOrderValue || "$0"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cancel Button */}
          <div className="px-4 mt-auto pb-4">
            {!isTradingEnabled ? (
              <button
                onClick={() => handleEnableTrading(walletAddress || "")}
                disabled={isLoading}
                className="w-full py-3 rounded-full bg-[#0187FF] text-white body-subtitle-semibold"
              >
                {isLoading ? "Enabling..." : "Enable Trading"}
              </button>
            ) : (
              <button
                onClick={handleCancelOrder}
                disabled={isLoading || cancellingOrderId === order.oid}
                className="w-full py-3 rounded-full bg-[#F04438] text-white body-subtitle-semibold"
              >
                {isLoading || cancellingOrderId === order.oid
                  ? "Canceling..."
                  : "Cancel Order"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  },
);

CancelOrderModal.displayName = "CancelOrderModal";
