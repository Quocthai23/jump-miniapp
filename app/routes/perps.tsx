import type { Route } from "./+types/perps";
import PerpsPage from "~/perps";

export async function loader({ params }: Route.LoaderArgs) {
  const { symbol } = params;
  return { symbol };
}

export default function Perps({ loaderData }: Route.ComponentProps) {
  return <PerpsPage symbol={loaderData.symbol} />;
}
