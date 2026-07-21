import HomePerp from "@/components/featured/perps/components/HomePerp";
import type { Route } from "./+types/home";
import { redirect } from "react-router";

// export async function loader({ request }: Route.LoaderArgs) {
//   const url = new URL(request.url);
//   const symbol = url.searchParams.get("symbol") || "BTC";

//   // Redirect to perps page with symbol
//   throw redirect(`/perps/${symbol}`);
// }

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <HomePerp />;
}
