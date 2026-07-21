import { useHyperliquid } from "@/contexts/HyperliquidContext";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

export function useTokenImage() {
  const { tokenImages } = useHyperliquid();
  // const [localMap, setLocalMap] = useState<Record<string, string>>({});

  const { data: localMap } = useQuery({
    queryKey: ["tokenManifest"],
    queryFn: async () => {
      const res = await fetch("/api/token-manifest", {
        cache: "force-cache",
      }).then((r) => r.json());
      return res;
    },
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const tokenImageMap = useMemo(() => {
    const map = new Map<string, string>();
    (tokenImages ?? []).forEach((t) => {
      if (t?.symbol && t?.image) map.set(t.symbol.toLowerCase(), t.image);
    });
    return map;
  }, [tokenImages]);

  const normalizeSymbol = useCallback((s: string) => {
    const key = s.toLowerCase().replace(/-perp|-spot$/i, "");
    if (key === "weth") return "eth";
    if (key === "xbt") return "btc";
    return key;
  }, []);

  const getImageForSymbol = useCallback(
    (symbol?: string) => {
      if (!symbol) return "/svg/crypto/coin.svg";
      const key = normalizeSymbol(symbol);
      return tokenImageMap.get(key) ?? "/svg/crypto/coin.svg";
    },
    [normalizeSymbol, tokenImageMap],
  );

  return { getImageForSymbol, tokenImageMap, normalizeSymbol, localMap };
}
