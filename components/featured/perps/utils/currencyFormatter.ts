/**
 * Format number to USD currency format with commas
 * Handles multiple decimal points and edge cases
 */
export const formatCurrency = (value: string): string => {
  // Remove all non-digit and non-decimal characters
  const cleaned = value.replace(/[^\d.]/g, "");

  // Handle multiple decimal points - keep only the first one
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    return (parts[0] || "") + "." + parts.slice(1).join("");
  }

  // If there's a decimal point, format the integer part with commas
  if (parts.length === 2) {
    const integerPart = (parts[0] || "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return integerPart + "." + (parts[1] || "");
  }

  // No decimal point, just format with commas
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Remove formatting (commas) from currency string
 */
export const unformatCurrency = (value: string): string => {
  return value.replace(/,/g, "");
};
