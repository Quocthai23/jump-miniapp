export const fromDisplayToSymbol = (coin: string) => {
  if (!coin) return "";
  return coin
    .replace("-", "")
    .replace("PERP", "")
    .replace("USDC", "")
    .toUpperCase();
};

export const fromSymbolToDisplay = (symbol: string) => {
  return symbol.includes("PERP")
    ? symbol.replace("PERP", "-PERP")
    : symbol + "-USDC";
};
