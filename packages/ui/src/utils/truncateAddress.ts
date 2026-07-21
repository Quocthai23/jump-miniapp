// Utility function to truncate address
export const truncateAddress = (
  address: string,
  prefixLength: number = 4,
  suffixLength: number = 4,
) => {
  if (!address) return "";
  if (suffixLength) {
    return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
  }
  return `${address.slice(0, prefixLength)}...${address.slice(-prefixLength)}`;
};
