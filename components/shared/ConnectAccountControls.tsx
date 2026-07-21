import { useAccount } from "wagmi";
import { useAccountModal, useConnectModal } from "@rainbow-me/rainbowkit";
import { Button } from "@/packages/ui/src/components/shared/atoms/button";
import { truncateAddress } from "@/packages/ui/src";

export function ConnectAccountControls() {
  const { isConnected: isWalletConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();

  if (!isWalletConnected) {
    return (
      <Button
        variant="primary"
        size="custom"
        className="text-body-sm-regular md:text-body-md-regular rounded-lg px-3 py-2"
        onClick={openConnectModal}
      >
        <span>Connect Wallet</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        // variant="dark"
        size="custom"
        className="text-body-sm-medium gap-2 rounded-lg border-transparent bg-[#303030] px-3 py-2 transition-colors hover:border-transparent hover:bg-[#1b1b1b] md:px-4 2xl:px-6"
        onClick={openAccountModal}
      >
        <div className="flex items-center gap-1">
          <span className="text-neutral-primary text-body-sm-medium md:text-body-md-medium">
            {address ? truncateAddress(address) : ""}
          </span>
        </div>
      </Button>
    </div>
  );
}
