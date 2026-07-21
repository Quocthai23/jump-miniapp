import { Wallet } from "ethers";

export const getAgentData = (
  walletAddress: string,
): { address: string; privateKey: string; userAddress: string } | null => {
  if (typeof window === "undefined" || sessionStorage === undefined) {
    return null;
  }

  const data = sessionStorage.getItem(
    `hyperliquid_agent_${walletAddress?.toLowerCase()}`,
  );
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  } else {
    const wallet = Wallet.createRandom();
    const savedData = {
      privateKey: wallet.privateKey,
      address: wallet.address,
      userAddress: walletAddress,
    };
    sessionStorage.setItem(
      `hyperliquid_agent_${walletAddress?.toLowerCase()}`,
      JSON.stringify(savedData),
    );
    return savedData;
  }
};

export const getAgentAddress = (
  walletAddress: string,
): { address: string; privateKey: string; userAddress: string } | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const key = `hyperliquid_agent_${walletAddress?.toLowerCase()}`;
  let data = sessionStorage.getItem(key);

  if (!data) {
    data = localStorage.getItem(key);
  }

  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
};
