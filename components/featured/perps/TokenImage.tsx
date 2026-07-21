import { useTokenImage } from "@/hooks/useTokenImage";
import { memo, useMemo, useState } from "react";

type TokenImageProps = {
  symbol?: string;
  size?: number;
  alt?: string;
  className?: string;
};

function TokenImage({ symbol, size = 20, alt, className }: TokenImageProps) {
  const { tokenImageMap, normalizeSymbol, localMap } = useTokenImage();
  const fallback = "/svg/crypto/coin.svg";

  // Merge both sources: prefer tokenImageMap first, then local manifest, then fallback
  const { sources, seed } = useMemo(() => {
    if (!symbol) return { sources: [fallback], seed: "nosymbol" };
    const key = normalizeSymbol(symbol);
    const list: string[] = [];
    const apiSrc = tokenImageMap.get(key);
    const local = localMap ? localMap[key] || null : null;
    if (apiSrc) list.push(apiSrc);
    if (local) list.push(local);
    // list.push(fallback);
    const uniq = Array.from(new Set(list));
    return { sources: uniq, seed: key };
  }, [symbol, normalizeSymbol, localMap, tokenImageMap]);

  // Step through sources on error to avoid 404/400
  const [idx, setIdx] = useState(0);

  return (
    <img
      src={sources[idx] || fallback}
      alt={alt ?? symbol ?? "token"}
      width={size}
      height={size}
      className={className}
      loading="lazy"
      onError={() => {
        setIdx((i) => (i < sources.length - 1 ? i + 1 : i));
      }}
    />
  );
}

export default memo(TokenImage, (prev, next) => {
  return prev.symbol === next.symbol;
});
