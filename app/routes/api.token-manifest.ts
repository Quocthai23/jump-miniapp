import type { LoaderFunctionArgs } from "react-router";
import path from "path";
import fs from "fs";

type Manifest = Record<string, string>;

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const dir = path.join(process.cwd(), "public", "token");
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const manifest: Manifest = {};
    for (const entry of files) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (![".png", ".webp", ".jpg", ".jpeg", ".svg"].includes(ext)) continue;
      const base = path.basename(entry.name, ext).toLowerCase();
      manifest[base] = `/token/${entry.name}`;
    }
    return new Response(JSON.stringify(manifest), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "failed_to_read" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
