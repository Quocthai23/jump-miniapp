export const formatPrice = (price: string | number, decimals: number = 2) => {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (!Number.isFinite(num)) return "0.00";

  const abs = Math.abs(num);
  const trimTrailingZeros = (value: string) => {
    const trimmed = value.replace(/\.?0+$/, "");
    return trimmed === "-0" ? "0" : trimmed;
  };

  // Keep larger values at two decimals with separators
  if (abs >= 1000) {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  return trimTrailingZeros(num.toFixed(decimals));
};
