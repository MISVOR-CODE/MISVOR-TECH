import { describe, expect, it, vi } from "vitest";

async function loadConfig() {
  vi.resetModules();
  const mod = await import("@/next.config");
  const exported = mod.default as unknown;
  return (typeof exported === "function" ? await exported("phase-production-build", { defaultConfig: {} }) : exported) as {
    output?: string;
    poweredByHeader?: boolean;
    images: { remotePatterns: Array<{ hostname: string; protocol: string }>; minimumCacheTTL: number; deviceSizes: number[] };
    headers: () => Promise<Array<{ source: string; headers: Array<{ key: string; value: string }> }>>;
  };
}

describe("next.config", () => {
  it("does not emit a standalone bundle unless building the Docker image", async () => {
    vi.stubEnv("BUILD_STANDALONE", "");
    expect((await loadConfig()).output).toBeUndefined();
    vi.stubEnv("BUILD_STANDALONE", "1");
    expect((await loadConfig()).output).toBe("standalone");
  });

  it("hides the framework header", async () => {
    expect((await loadConfig()).poweredByHeader).toBe(false);
  });

  it("allows any https image host by default (previous behaviour)", async () => {
    vi.stubEnv("IMAGE_REMOTE_HOSTS", "");
    const { images } = await loadConfig();
    expect(images.remotePatterns).toEqual([{ protocol: "https", hostname: "**" }]);
  });

  it("restricts image hosts when IMAGE_REMOTE_HOSTS is set, keeping the placeholder host", async () => {
    vi.stubEnv("IMAGE_REMOTE_HOSTS", " images.example.com , *.cdn.example.com ");
    const { images } = await loadConfig();
    expect(images.remotePatterns.map((p) => p.hostname)).toEqual(["images.example.com", "*.cdn.example.com", "picsum.photos"]);
    expect(images.remotePatterns.every((p) => p.protocol === "https")).toBe(true);
  });

  it("caches optimized images long and trims oversized widths", async () => {
    const { images } = await loadConfig();
    expect(images.minimumCacheTTL).toBeGreaterThanOrEqual(60 * 60 * 24 * 30);
    expect(Math.max(...images.deviceSizes)).toBeLessThanOrEqual(1920);
  });

  it("sends security headers everywhere and cache headers for static media", async () => {
    const rules = await (await loadConfig()).headers();
    const all = rules.find((r) => r.source === "/:path*")!.headers.map((h) => h.key);
    expect(all).toEqual(expect.arrayContaining(["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"]));
    for (const dir of ["/videos/:path*", "/images/:path*", "/icons/:path*"]) {
      const cache = rules.find((r) => r.source === dir)!.headers.find((h) => h.key === "Cache-Control")!;
      expect(cache.value).toContain("max-age=86400");
    }
  });
});
