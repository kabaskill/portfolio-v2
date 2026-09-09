import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";

// Keep previews canonical to the stable production host, not CF_PAGES_URL's deployment URL.
const siteUrl = process.env.SITE_URL ?? loadEnv("production", process.cwd(), "SITE_URL").SITE_URL;
const site = new URL(siteUrl || "http://localhost:4321");
if (siteUrl && (
  site.protocol !== "https:" || site.username || site.password ||
  site.pathname !== "/" || site.search || site.hash || site.port ||
  ["localhost", "example.com", "your-project.pages.dev"].includes(site.hostname)
)) {
  throw new Error("SITE_URL must be your public HTTPS origin, e.g. https://your-chosen-name.pages.dev (no path).");
}

export default defineConfig({
  integrations: [
    {
      name: "production-site-url",
      hooks: {
        "astro:config:setup": ({ command }) => {
          if (command === "build" && !siteUrl) {
            throw new Error("Set SITE_URL to your stable production URL before building. See .env.example and docs/cloudflare-pages.md.");
          }
        },
      },
    },
    mdx(),
    react(),
    sitemap(),
  ],
  vite: { plugins: [tailwindcss()] },
  output: "static",
  site: site.href,
  trailingSlash: "always",
});
