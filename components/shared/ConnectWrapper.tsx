import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import React, { useMemo, type ReactElement } from "react";

interface ConnectWrapperProps {
  needConnectX?: boolean;
  children: ReactElement<any>;
}

export const ConnectWrapper = ({ children }: ConnectWrapperProps) => {
  const { openConnectModal } = useConnectModal();

  const isAuthenticated = true;
  const { isConnected } = useAccount();

  const isWalletConnected = useMemo(() => {
    return isConnected && isAuthenticated;
  }, [isConnected, isAuthenticated]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isWalletConnected) {
      e.preventDefault();
      e.stopPropagation();
      openConnectModal?.();
      return;
    }

    if (isWalletConnected) {
      e.preventDefault();
      e.stopPropagation();
      console.warn("ConnectX functionality not implemented yet");
      return;
    }

    const childOnClick = children?.props?.onClick;
    if (typeof childOnClick === "function") {
      childOnClick(e);
    }
  };

  return React.cloneElement(children, { onClick: handleClick });
};
