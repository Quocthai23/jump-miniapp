export interface TokenImage {
  symbol: string;
  name: string;
  image: string;
}

export async function fetchTokenImages(): Promise<TokenImage[]> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch token images");
    }

    const data = await response.json();

    const filtered: TokenImage[] = Array.isArray(data)
      ? data.map((item: { symbol: string; name: string; image: string }) => ({
          symbol: item.symbol,
          name: item.name,
          image: item.image,
        }))
      : [];

    return filtered;
  } catch (error) {
    console.error("Error fetching token images:", error);
    throw error;
  }
}
