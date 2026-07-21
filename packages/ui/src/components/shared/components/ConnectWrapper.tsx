import React, { ReactElement, useMemo } from "react";

interface ConnectWrapperProps {
  isConnected: boolean;
  isAuthenticated: boolean;
  needConnectX?: boolean;
  onConnectWallet: () => void;
  onConnectX?: () => void;
  children: ReactElement<any>;
}

/**
 * A reusable wrapper component that handles wallet connection and authentication logic.
 * This version is framework-agnostic and can be used across different apps in the monorepo.
 */
export const ConnectWrapper = ({
  isConnected,
  isAuthenticated,
  needConnectX = false,
  onConnectWallet,
  onConnectX,
  children,
}: ConnectWrapperProps) => {
  const isWalletConnected = useMemo(() => {
    return isConnected && isAuthenticated;
  }, [isConnected, isAuthenticated]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isWalletConnected) {
      e.preventDefault();
      e.stopPropagation();
      onConnectWallet();
      return;
    }

    if (isWalletConnected && needConnectX && onConnectX) {
      e.preventDefault();
      e.stopPropagation();
      onConnectX();
      return;
    }

    // If there is onClick in children, call it
    const childOnClick = children?.props?.onClick;
    if (typeof childOnClick === "function") {
      childOnClick(e);
    }
  };

  return React.cloneElement(children, { onClick: handleClick });
};
