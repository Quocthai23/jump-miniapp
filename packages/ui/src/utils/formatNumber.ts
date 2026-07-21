import BigNumber from "bignumber.js";

export const formatLargeNumber = (number: number, decimal = true) => {
  const decimalNumber = (n: number) => {
    if (n > 100) return 1;
    if (n > 10) return 2;
    return 3;
  };

  const format = (n: number) =>
    decimal
      ? roundDownNumber(n, decimalNumber(n)).toString()
      : Math.floor(n).toString();

  if (number >= 1000000000) {
    return `${format(number / 1000000000)}B`;
  } else if (number >= 1000000) {
    return `${format(number / 1000000)}M`;
  } else if (number >= 1000) {
    return `${format(number / 1000)}K`;
  } else {
    return format(number);
  }
};

export const roundDownNumber = (num: number, decimals: number): number => {
  const multiplier = Math.pow(10, decimals);
  const roundedNum = Math.floor(num * multiplier) / multiplier;
  return roundedNum;
};

export const formatNumberWithNumeral = (
  val: number | string,
  suffix = 4,
): string => {
  try {
    const num = new BigNumber(val);
    if (isNaN(num.toNumber())) return "0";

    // Handle very small numbers
    if (num.isLessThanOrEqualTo(1e-7)) {
      return num.toFixed(suffix);
    }

    // Convert to number and truncate to specified decimal places (not round)
    const numValue = num.toNumber();

    // Truncate to suffix decimal places instead of rounding
    const multiplier = Math.pow(10, suffix);
    const truncatedValue = Math.floor(numValue * multiplier) / multiplier;

    let formatted = truncatedValue.toFixed(suffix);

    // Remove trailing zeros and decimal point if not needed
    if (formatted.includes(".")) {
      formatted = formatted.replace(/\.?0+$/, "");
    }

    // Add thousand separators if the number is >= 1000
    if (Math.abs(truncatedValue) >= 1000) {
      const parts = formatted.split(".");
      if (parts[0]) {
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
      return parts.join(".");
    }

    return formatted;
  } catch {
    return "0";
  }
};

export const formatCompleteNumber = (
  value: number | string,
  options: {
    minDecimals?: number;
    maxDecimals?: number;
    useThousandSeparator?: boolean;
    useLargeNumberSuffix?: boolean;
    minValueForSuffix?: number;
    useCompactNotation?: boolean;
    useSubscriptNotation?: boolean;
    currencyPrefix?: string;
    currencySuffix?: string;
    significantDigits?: number;
  } = {},
): string => {
  const {
    minDecimals = 0,
    maxDecimals = 8,
    useThousandSeparator = true,
    useLargeNumberSuffix = true,
    minValueForSuffix = 1000,
    useCompactNotation = true,
    useSubscriptNotation = false,
    currencyPrefix = "",
    currencySuffix = "",
    significantDigits = 8,
  } = options;

  try {
    const num = new BigNumber(value);

    // Handle invalid numbers
    if (!num.isFinite()) return `${currencyPrefix}0${currencySuffix}`;

    const numValue = num.toNumber();
    const absValue = Math.abs(numValue);

    // Handle zero
    if (absValue === 0) return `${currencyPrefix}0${currencySuffix}`;

    // Handle very small numbers with compact or subscript notation (only for numbers < 0.001)
    if (absValue > 0 && absValue < 0.001) {
      if (useSubscriptNotation) {
        // Use subscript notation similar to TextPrice component
        const str = numValue.toFixed(20);
        const afterDecimal = str.split(".")[1];
        let zeroCount = 0;

        if (!afterDecimal) return `${currencyPrefix}0${currencySuffix}`;

        for (let i = 0; i < afterDecimal.length; i++) {
          if (afterDecimal[i] === "0") {
            zeroCount++;
          } else {
            break;
          }
        }

        // Get significant part after zeros and remove trailing zeros
        let significantPart = afterDecimal.substring(
          zeroCount,
          zeroCount + significantDigits,
        );
        // Remove trailing zeros from significant part
        significantPart = significantPart.replace(/0+$/, "");
        // Ensure we have at least one digit
        if (significantPart === "") {
          significantPart = "0";
        }

        // Return format that can be used with JSX subscript
        return `${currencyPrefix}0.0_{${zeroCount}}_${significantPart}${currencySuffix}`;
      } else if (useCompactNotation) {
        return `${currencyPrefix}${formatSmallNumberCompact(numValue, true)}${currencySuffix}`;
      }
    }

    // Handle very large numbers with suffix
    if (useLargeNumberSuffix && absValue >= minValueForSuffix) {
      if (absValue >= 1e12) {
        return `${currencyPrefix}${formatWithSuffix(numValue / 1e12, "T", maxDecimals)}${currencySuffix}`;
      } else if (absValue >= 1e9) {
        return `${currencyPrefix}${formatWithSuffix(numValue / 1e9, "B", maxDecimals)}${currencySuffix}`;
      } else if (absValue >= 1e6) {
        return `${currencyPrefix}${formatWithSuffix(numValue / 1e6, "M", maxDecimals)}${currencySuffix}`;
      } else if (absValue >= 1e3) {
        return `${currencyPrefix}${formatWithSuffix(numValue / 1e3, "K", maxDecimals)}${currencySuffix}`;
      }
    }

    // Determine appropriate decimal places
    let decimals = maxDecimals;
    if (absValue >= 1) {
      decimals = Math.min(maxDecimals, 4);
    } else if (absValue >= 0.1) {
      decimals = Math.min(maxDecimals, 4);
    } else if (absValue >= 0.01) {
      decimals = Math.min(maxDecimals, 4);
    } else if (absValue >= 0.001) {
      decimals = Math.min(maxDecimals, 6);
    } else if (absValue >= 0.0001) {
      decimals = Math.min(maxDecimals, 7);
    } else {
      decimals = maxDecimals;
    }

    // Ensure minimum decimals
    decimals = Math.max(decimals, minDecimals);

    // Truncate to specified decimal places
    const multiplier = Math.pow(10, decimals);
    const truncatedValue = Math.floor(numValue * multiplier) / multiplier;

    let formatted = truncatedValue.toFixed(decimals);

    // Remove trailing zeros if minDecimals allows it
    if (decimals > minDecimals && formatted.includes(".")) {
      formatted = formatted.replace(/\.?0+$/, "");

      // Ensure we don't go below minDecimals
      const currentDecimals = formatted.split(".")[1]?.length || 0;
      if (currentDecimals < minDecimals) {
        formatted = truncatedValue.toFixed(minDecimals);
      }
    }

    // Add thousand separators
    if (useThousandSeparator && Math.abs(truncatedValue) >= 1000) {
      const parts = formatted.split(".");
      if (parts[0]) {
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
      formatted = parts.join(".");
    }

    return `${currencyPrefix}${formatted}${currencySuffix}`;
  } catch {
    return `${currencyPrefix}0${currencySuffix}`;
  }
};

// React-compatible version that returns formatted string with subscript info
export const formatCompleteNumberReact = (
  value: number | string,
  options: {
    minDecimals?: number;
    maxDecimals?: number;
    useThousandSeparator?: boolean;
    useLargeNumberSuffix?: boolean;
    minValueForSuffix?: number;
    useCompactNotation?: boolean;
    useSubscriptNotation?: boolean;
    currencyPrefix?: string;
    currencySuffix?: string;
    significantDigits?: number;
  } = {},
): {
  formatted: string;
  hasSubscript: boolean;
  subscriptData?: {
    zeroCount: number;
    significantPart: string;
    prefix: string;
    suffix: string;
  };
} => {
  const {
    // minDecimals = 0,
    // maxDecimals = 8,
    // useThousandSeparator = true,
    // useLargeNumberSuffix = true,
    // minValueForSuffix = 1000,
    // useCompactNotation = true,
    useSubscriptNotation = false,
    currencyPrefix = "",
    currencySuffix = "",
    significantDigits = 8,
  } = options;

  try {
    const num = new BigNumber(value);

    // Handle invalid numbers
    if (!num.isFinite()) {
      return {
        formatted: `${currencyPrefix}0${currencySuffix}`,
        hasSubscript: false,
      };
    }

    const numValue = num.toNumber();
    const absValue = Math.abs(numValue);

    // Handle zero
    if (absValue === 0) {
      return {
        formatted: `${currencyPrefix}0${currencySuffix}`,
        hasSubscript: false,
      };
    }

    // Handle very small numbers with subscript notation (only for numbers < 0.001)
    if (absValue > 0 && absValue < 0.001 && useSubscriptNotation) {
      const str = numValue.toFixed(20);
      const afterDecimal = str.split(".")[1];
      let zeroCount = 0;

      if (!afterDecimal) return { formatted: "", hasSubscript: false };

      for (let i = 0; i < afterDecimal.length; i++) {
        if (afterDecimal[i] === "0") {
          zeroCount++;
        } else {
          break;
        }
      }

      // Get significant part after zeros and remove trailing zeros
      let significantPart = afterDecimal.substring(
        zeroCount,
        zeroCount + significantDigits,
      );
      // Remove trailing zeros from significant part
      significantPart = significantPart.replace(/0+$/, "");
      // Ensure we have at least one digit
      if (significantPart === "") {
        significantPart = "0";
      }

      return {
        formatted: "",
        hasSubscript: true,
        subscriptData: {
          zeroCount,
          significantPart,
          prefix: currencyPrefix,
          suffix: currencySuffix,
        },
      };
    }

    // Use regular formatCompleteNumber for other cases
    const formatted = formatCompleteNumber(value, options);
    return { formatted, hasSubscript: false };
  } catch {
    return {
      formatted: `${currencyPrefix}0${currencySuffix}`,
      hasSubscript: false,
    };
  }
};

// Helper function to get formatting data for React components
export const getPriceFormatData = (
  num: number | string | null | undefined,
  options: {
    isHideDollar?: boolean;
    minDecimals?: number;
    maxDecimals?: number;
    useThousandSeparator?: boolean;
    useLargeNumberSuffix?: boolean;
    minValueForSuffix?: number;
    useCompactNotation?: boolean;
    useSubscriptNotation?: boolean;
    significantDigits?: number;
  } = {},
) => {
  const {
    isHideDollar = false,
    minDecimals = 2,
    maxDecimals = 4,
    useSubscriptNotation = true,
    significantDigits = 8,
    ...restOptions
  } = options;

  if (num == null) {
    return {
      formatted: isHideDollar ? "0" : "$0",
      hasSubscript: false,
    };
  }

  const number = parseFloat(num as string);

  if (isNaN(number) || number === 0) {
    return {
      formatted: isHideDollar ? "0" : "$0",
      hasSubscript: false,
    };
  }

  // For whole numbers, don't use minDecimals to avoid unnecessary .00
  const isWholeNumber = Number.isInteger(number);
  const adjustedMinDecimals = isWholeNumber ? 0 : minDecimals;

  const formatOptions = {
    minDecimals: adjustedMinDecimals,
    maxDecimals,
    useSubscriptNotation,
    currencyPrefix: isHideDollar ? "" : "$",
    currencySuffix: "",
    significantDigits,
    ...restOptions,
  };

  return formatCompleteNumberReact(number, formatOptions);
};

// Helper function for formatting very small numbers in compact notation
const formatSmallNumberCompact = (
  value: number,
  useCompactNotation: boolean = true,
): string => {
  const absValue = Math.abs(value);
  const isNegative = value < 0;

  if (absValue === 0) return "0";

  // If compact notation is disabled, use regular formatting
  if (!useCompactNotation) {
    return value.toFixed(8).replace(/\.?0+$/, "");
  }

  // Convert to string to find the position of first non-zero digit
  const valueStr = absValue.toString();

  // Handle numbers in scientific notation
  if (valueStr.includes("e")) {
    const [mantissa, exponentStr] = valueStr.split("e");
    const exponent = parseInt(exponentStr || "0", 10);

    if (exponent >= -3) {
      // Not small enough for compact notation
      return value.toFixed(6).replace(/\.?0+$/, "");
    }

    // Calculate number of leading zeros after decimal point
    const leadingZeros = Math.abs(exponent) - 1;

    // Get significant digits from mantissa (first digit + up to 7 more digits, remove trailing zeros)
    const mantissaClean = (mantissa || "0").replace(".", "");
    const firstDigit = mantissaClean[0];
    let endDigits = mantissaClean.substring(1, 8); // Get up to 7 digits after first
    // Remove trailing zeros
    endDigits = endDigits.replace(/0+$/, "");

    const result = `0.0{${leadingZeros}}${firstDigit}${endDigits}`;

    return isNegative ? `-${result}` : result;
  }

  // Handle decimal numbers
  if (valueStr.includes(".")) {
    const decimalPart = valueStr.split(".")[1];
    let leadingZeros = 0;
    let firstNonZeroIndex = 0;

    // Count leading zeros after decimal point
    if (decimalPart) {
      for (let i = 0; i < decimalPart.length; i++) {
        if (decimalPart[i] === "0") {
          leadingZeros++;
        } else {
          firstNonZeroIndex = i;
          break;
        }
      }

      // If there are at least 3 leading zeros, use compact notation
      if (leadingZeros >= 3) {
        const significantPart = decimalPart.substring(firstNonZeroIndex);
        const firstDigit = significantPart[0] || "0";
        let endDigits = significantPart.substring(1, 8); // Get up to 7 digits after first
        // Remove trailing zeros
        endDigits = endDigits.replace(/0+$/, "");

        const result = `0.0{${leadingZeros}}${firstDigit}${endDigits}`;
        return isNegative ? `-${result}` : result;
      }
    }
  }

  // Fallback to regular formatting
  return value.toFixed(6).replace(/\.?0+$/, "");
};

// Helper function for formatting with suffix
const formatWithSuffix = (
  value: number,
  suffix: string,
  maxDecimals: number,
): string => {
  const absValue = Math.abs(value);
  let decimals = 2;

  // Adjust decimals based on value size
  if (absValue >= 100) {
    decimals = 1;
  } else if (absValue >= 10) {
    decimals = 2;
  } else {
    decimals = Math.min(maxDecimals, 3);
  }

  // Always respect maxDecimals
  decimals = Math.min(decimals, maxDecimals);

  const multiplier = Math.pow(10, decimals);
  const truncatedValue = Math.floor(value * multiplier) / multiplier;

  let formatted = truncatedValue.toFixed(decimals);

  // Remove trailing zeros
  if (formatted.includes(".")) {
    formatted = formatted.replace(/\.?0+$/, "");
  }

  return `${formatted}${suffix}`;
};

export function formatSmartNumber(
  num: number,
  decimals: number = 4,
  options?: { currencyPrefix?: string; useCurlyZero?: boolean },
): string {
  const prefix = options?.currencyPrefix ?? "";
  const useCurly = options?.useCurlyZero ?? true;

  // Calculate the number of digits after the decimal point
  const numStr = num.toString();
  const decimalIndex = numStr.indexOf(".");
  const actualDecimals =
    decimalIndex !== -1 ? numStr.length - decimalIndex - 1 : 0;
  const finalDecimals = Math.min(actualDecimals, decimals);

  if (num === 0) return `${prefix}0`;

  if (num < 1e-6) {
    const fullStr = num.toFixed(100);
    const decimalPart = fullStr.split(".")[1];

    const match = decimalPart?.match(/^(0+)/);
    const zeroCount = match?.[1]?.length ?? 0;

    let significant =
      decimalPart?.slice(zeroCount, zeroCount + finalDecimals) ?? "";
    // Remove trailing zeros from significant part
    significant = significant.replace(/0+$/, "");
    // Ensure we have at least one digit
    if (significant === "") {
      significant = "0";
    }

    const zeroDisplay = useCurly
      ? `0.0{${zeroCount}}`
      : `0.${"0".repeat(zeroCount)}`;

    return `${prefix}${zeroDisplay}${significant}`;
  }

  return (
    prefix +
    Number(num).toLocaleString("en-US", {
      minimumFractionDigits: finalDecimals,
      maximumFractionDigits: finalDecimals,
    })
  );
}
