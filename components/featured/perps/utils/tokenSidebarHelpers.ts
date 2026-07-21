/**
 * Utility functions for TokenSidebar component
 */

export function formatPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function changeColor(value: number): string {
  return value >= 0 ? "dark:text-green-500" : "dark:text-red-500";
}

export function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString("en-US", { maximumFractionDigits: 1 });
  }
  return price.toFixed(2);
}
