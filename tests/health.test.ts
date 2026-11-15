import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: queryRaw } }));

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("is a cheap liveness check that never queries the database", async () => {
    const res = await GET(new NextRequest("http://x/api/health"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it("deep check reports the database as up", async () => {
    queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    const res = await GET(new NextRequest("http://x/api/health?deep=1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", db: "up" });
  });

  it("deep check returns 503 without leaking error details", async () => {
    queryRaw.mockRejectedValue(new Error("password authentication failed for user ogsp"));
    const res = await GET(new NextRequest("http://x/api/health?deep=1"));
    expect(res.status).toBe(503);
    const text = await res.text();
    expect(text).not.toContain("password");
    expect(JSON.parse(text)).toEqual({ status: "error", db: "down" });
  });
});
