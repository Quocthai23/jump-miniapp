import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/perps/:symbol", "routes/perps.tsx"),
  route("/api/token-manifest", "routes/api.token-manifest.ts"),
] satisfies RouteConfig;
