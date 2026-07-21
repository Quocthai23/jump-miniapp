export const safeParseFloat = (value: string | number | undefined): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;
  return parseFloat(String(value)) || 0;
};

// Note: Data fetching is now handled by React Query hooks above
// Data is automatically refetched based on staleTime and refetchInterval settings

export const formatSize = (size: string | number) => {
  const num = typeof size === "string" ? parseFloat(size) : size;
  if (isNaN(num)) return "0.00";
  if (num >= 1) {
    return num.toFixed(4);
  }
  return num.toFixed(4);
};
