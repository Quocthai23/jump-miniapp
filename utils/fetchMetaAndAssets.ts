export interface MarketData {
  name: string;
  symbol: string;
  decimals: number;
  price: number;
  prevPrice: number;
  change24h: number;
  volume24h: number;
  openInterest: number;
  oraclePx: number;
  funding: number;
  marginTable: any[];
  [key: string]: any;
}

export async function fetchMetaAndAssets(): Promise<MarketData[]> {
  try {
    // const hyperliquidUrl =
    //   import.meta.env.VITE_TESTNET === "true"
    //     ? "https://api.hyperliquid-testnet.xyz/info"
    //     : "https://api.hyperliquid.xyz/info";
    //     console.log("VITE_TESTNET:", import.meta.env.VITE_TESTNET);
    // console.log("Fetching data from Hyperliquid API:", hyperliquidUrl);
    console.log("Fetching data from Hyperliquid API:");
    const response = await fetch("https://api.hyperliquid-testnet.xyz/info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "metaAndAssetCtxs",
      }),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error("Error fetching data from Hyperliquid API:", e);
        return null;
      });

    if (response) {
      const universeData = response[0] ? response[0]?.universe || [] : [];
      const marginTable = response[0]
        ? (response[0] as any)?.marginTables || []
        : [];

      const assetCtxsData = response[1] ? response[1] || [] : [];

      if (universeData?.length > 0 && assetCtxsData?.length > 0) {
        const formattedMarketData = universeData.map(
          (universe: any, index: number) => {
            const assetCtx = assetCtxsData[index];

            const price = parseFloat(assetCtx?.markPx as string);
            const prevPrice = parseFloat(assetCtx?.prevDayPx as string);
            const change24h =
              prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0;
            const volume24h = parseFloat(assetCtx?.dayNtlVlm as string);
            const openInterest = parseFloat(assetCtx?.openInterest as string);
            const oraclePx = parseFloat(assetCtx?.oraclePx as string);
            const funding = parseFloat(assetCtx?.funding as string);

            const decimals = price.toString().split(".")[1]?.length ?? 0;
            const prevDecimals =
              prevPrice.toString().split(".")[1]?.length ?? 0;
            const oracleDecimals =
              oraclePx.toString().split(".")[1]?.length ?? 0;

            const realDecimals = Math.max(
              decimals,
              prevDecimals,
              oracleDecimals,
            );

            const currentMarginTable = marginTable.find((m: any) => {
              if (m[0] === universe.marginTableId) {
                return true;
              }
              return false;
            });

            const data: MarketData = {
              ...universe,
              symbol: universe.name.replace("-PERP", ""),
              decimals: realDecimals,
              price,
              prevPrice,
              change24h,
              volume24h,
              openInterest,
              oraclePx,
              funding,
              marginTable: currentMarginTable
                ? currentMarginTable[1]?.marginTiers
                : [],
            };
            return data;
          },
        );
        return formattedMarketData;
      }
    }
    throw new Error("No data received from Hyperliquid API");
  } catch (e) {
    console.error("Failed to fetch meta and assets:", e);
    throw new Error("failed_to_read");
  }
}
