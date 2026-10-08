// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { getPublicSupabaseConfig } from "./src/integrations/supabase/public-config";

// Netlify provides these at build time. Use the current preview URL for previews
// and the primary domain in production so shared images stay on the same host.
const netlifySiteUrl =
  process.env["CONTEXT"] === "production"
    ? process.env["URL"]
    : process.env["DEPLOY_PRIME_URL"] || process.env["URL"];
const siteUrl = process.env["VITE_SITE_URL"] || netlifySiteUrl;

export default defineConfig({
  plugins: [
    {
      name: "validate-public-supabase-config",
      configResolved(config) {
        // Stop before bundling if a private key was put in a public env variable.
        getPublicSupabaseConfig(
          config.env["VITE_SUPABASE_URL"],
          config.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
        );
      },
    },
  ],
  // Reuse the wrapper's Nitro integration; adding another adapter duplicates it.
  nitro: { preset: "netlify" },
  vite: {
    define: siteUrl ? { "import.meta.env.VITE_SITE_URL": JSON.stringify(siteUrl) } : {},
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
