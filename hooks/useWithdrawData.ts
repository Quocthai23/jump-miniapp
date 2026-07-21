import { useState, useEffect } from "react";

interface WithdrawData {
  availableBalance: number;
  providerFee: number;
  estimatedTime: string;
  currency: string;
}

export function useWithdrawData(): WithdrawData {
  const [data, setData] = useState<WithdrawData>({
    availableBalance: 10,
    providerFee: 1.0,
    estimatedTime: "5 minutes",
    currency: "USDC",
  });

  useEffect(() => {}, []);

  return data;
}
