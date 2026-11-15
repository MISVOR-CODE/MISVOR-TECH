import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Remote hosts next/image may fetch and optimize, from IMAGE_REMOTE_HOSTS
 * (comma-separated, e.g. "images.example.com,*.cdn.example.com").
 *
 * When unset, any https host is allowed (the previous behaviour). That is
 * convenient while content comes from arbitrary URLs, but it lets anyone use
 * your image optimizer, which is billed on Vercel, as an open proxy. Set the
 * variable in production to the hosts your editors actually use.
 */
const remoteHosts = (process.env.IMAGE_REMOTE_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] =
  remoteHosts.length > 0
    ? // picsum.photos serves the placeholder cards shown before any article exists.
      [...new Set([...remoteHosts, "picsum.photos"])].map((hostname) => ({
        protocol: "https" as const,
        hostname
      }))
    : [{ protocol: "https", hostname: "**" }];

// Static media in /public has no content hash in its filename, so it can't be
// cached forever, but a day (plus stale-while-revalidate) beats Vercel's
// default of revalidating on every request.
const publicMediaCache = [
  { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }
];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" }
];

const nextConfig: NextConfig = {
  // Only the Docker image needs the self-contained server bundle. On Vercel the
  // platform builds its own output, so this stays off unless explicitly set.
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,

  poweredByHeader: false,

  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
    // Optimized variants are cached for 31 days: fewer re-transformations
    // (a Vercel cost) for images whose URL doesn't change.
    minimumCacheTTL: 60 * 60 * 24 * 31,
    // The layout tops out at max-w-7xl (1280px), so the default 2048/3840
    // widths only produce oversized files nobody needs.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920]
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "5mb"
    }
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/videos/:path*", headers: publicMediaCache },
      { source: "/images/:path*", headers: publicMediaCache },
      { source: "/icons/:path*", headers: publicMediaCache }
    ];
  }
};

export default withNextIntl(nextConfig);
