import { useEffect, useState } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "config/react-query";
import { HydrateMarketData } from "./HydrateStore";
import { fetchMetaAndAssets } from "@/utils/fetchMetaAndAssets";
import Home from "./container";
import { useClearinghouseStore } from "@/state/clearinghouseStore";

interface PerpsPageProps {
  symbol?: string;
}

const PerpsPage = ({ symbol = "BTC" }: PerpsPageProps) => {
  const [marketData, setMarketData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = getQueryClient();
  const { assetPositions, setCurrentPosition } = useClearinghouseStore();
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchMetaAndAssets();
        if (data && data.length > 0) {
          setMarketData(data);
          // await queryClient.setQueryData(["metaAndAssetCtxs"], data);
        } else {
          console.warn("No market data returned from API");
        }
      } catch (error) {
        console.error("Error loading market data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  useEffect(() => {
    if (assetPositions && assetPositions.length > 0) {
      const found = assetPositions.find(
        (pos: any) =>
          pos.position?.coin === symbol ||
          pos.position?.coin === `${symbol}-PERP`,
      );
      if (found) {
        setCurrentPosition(found?.position);
      } else {
        setCurrentPosition(null);
      }
    } else {
      setCurrentPosition(null);
    }
  }, [assetPositions, symbol, setCurrentPosition]);

  if (loading) {
    return null;
  }
  if (!marketData || marketData.length === 0) {
    return <div>Not found</div>;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HydrateMarketData symbol={symbol || "BTC"} marketData={marketData} />
      <Home />
    </HydrationBoundary>
  );
};

export default PerpsPage;
