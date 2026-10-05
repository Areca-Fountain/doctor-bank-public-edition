import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["require-in-the-middle", "import-in-the-middle"],
};

// Source maps are what Sentry uploads at build time (368+ files with Turbopack).
// Default = OFF so Netlify free-plan builds stay fast and light.
// To turn on: set SENTRY_UPLOAD_SOURCEMAPS=true AND SENTRY_AUTH_TOKEN in Netlify env vars.
const uploadSourceMaps =
  process.env.SENTRY_UPLOAD_SOURCEMAPS === "true" && !!process.env.SENTRY_AUTH_TOKEN;

export default withSentryConfig(nextConfig, {
  org: "areca-3n",
  project: "doctor-bank-web",

  silent: !process.env.CI,
  telemetry: false, // no build-time telemetry calls to Sentry

  // Keep the upload small: browser bundles only, no "wide" upload.
  widenClientFileUpload: false,

  sourcemaps: {
    disable: !uploadSourceMaps,
    // Server/edge maps are the bulk of the ~368 files; browser maps are enough for most debugging.
    ignore: ["**/server/**", "**/edge/**", "**/node_modules/**"],
    // Don't ship .map files to the public site or keep them in the deploy bundle.
    deleteSourcemapsAfterUpload: true,
  },

  // Route browser events through your own domain to dodge ad-blockers.
  // (proxy.ts matcher only covers /chat, /dashboard, /admin, so /monitoring is not blocked.)
  tunnelRoute: "/monitoring",
});