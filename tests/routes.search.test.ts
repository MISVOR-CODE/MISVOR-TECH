import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: queryRaw } }));

import { GET } from "@/app/api/search/route";
import { getSearchableCategories, searchArticles } from "@/lib/search";

const sqlOf = (call: unknown[]) => call[0] as { strings: string[]; values: unknown[] };

describe("searchArticles", () => {
  it("returns an empty page for a blank query without touching the database", async () => {
    expect(await searchArticles({ q: "   ", locale: "es" })).toEqual({ results: [], total: 0, page: 1, pageSize: 10 });
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it.each([
    ["es", "spanish", "ES"],
    ["en", "english", "EN"],
    ["fr", "french", "FR"]
  ] as const)("uses the %s text-search config and locale filter", async (locale, config, enumValue) => {
    queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: 0n }]);
    await searchArticles({ q: "iva", locale });

    const [results, count] = queryRaw.mock.calls;
    for (const call of [results, count]) {
      expect(sqlOf(call).values).toEqual(expect.arrayContaining([config, enumValue, "iva"]));
    }
  });

  it("passes user input as bound parameters, never inline SQL", async () => {
    queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: 0n }]);
    const hostile = `'; DROP TABLE "Article"; --`;
    await searchArticles({ q: hostile, locale: "en", categorySlug: `x' OR '1'='1` });

    const query = sqlOf(queryRaw.mock.calls[0]);
    expect(query.strings.join("")).not.toContain("DROP TABLE");
    expect(query.strings.join("")).not.toContain("OR '1'='1");
    expect(query.values).toEqual(expect.arrayContaining([hostile, `x' OR '1'='1`]));
  });

  it("converts bigint counts and computes the offset from the page", async () => {
    queryRaw.mockResolvedValueOnce([{ id: "1", rank: "0.5" }]).mockResolvedValueOnce([{ count: 42n }]);
    const res = await searchArticles({ q: "iva", locale: "es", page: 3, pageSize: 10 });
    expect(res.total).toBe(42);
    expect(res.results[0].rank).toBe(0.5)
    expect(sqlOf(queryRaw.mock.calls[0]).values).toEqual(expect.arrayContaining([10, 20]));
  });
});

describe("getSearchableCategories", () => {
  it.each([["en", '"nameEn"'], ["fr", '"nameFr"'], ["es", '"name"']] as const)(
    "reads the right label column for %s and falls back to the default name",
    async (locale, column) => {
      queryRaw.mockResolvedValueOnce([
        { slug: "a", name: "Tax", fallback: "Fiscal" },
        { slug: "b", name: null, fallback: "Laboral" }
      ]);
      const out = await getSearchableCategories(locale);
      expect(sqlOf(queryRaw.mock.calls.at(-1)!).strings.join("")).toContain(`c.${column} AS "name"`);
      expect(out).toEqual([{ slug: "a", name: "Tax" }, { slug: "b", name: "Laboral" }]);
    }
  );
});

describe("GET /api/search", () => {
  it("falls back to the default locale and is cacheable at the CDN", async () => {
    const res = await GET(new NextRequest("http://x/api/search?q=&locale=zz"));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("s-maxage=30");
  });

  it("caps autocomplete at 5 results and normalizes a bad page number", async () => {
    queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: 0n }]);
    const res = await GET(new NextRequest("http://x/api/search?q=iva&locale=es&mode=autocomplete&page=-9"));
    expect(await res.json()).toMatchObject({ pageSize: 5, page: 1 });
  });
});
