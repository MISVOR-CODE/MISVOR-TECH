import { NextRequest, NextResponse } from "next/server";
import { routing, type Locale } from "@/i18n/routing";
import { searchArticles, AUTOCOMPLETE_LIMIT, SEARCH_PAGE_SIZE } from "@/lib/search";

function parseLocale(value: string | null): Locale {
  return routing.locales.includes(value as Locale) ? (value as Locale) : routing.defaultLocale;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q") ?? "";
  const locale = parseLocale(searchParams.get("locale"));
  const categorySlug = searchParams.get("category") || undefined;
  const mode = searchParams.get("mode"); // "autocomplete" | null (full results)
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const pageSize = mode === "autocomplete" ? AUTOCOMPLETE_LIMIT : SEARCH_PAGE_SIZE;

  const data = await searchArticles({ q, locale, categorySlug, page, pageSize });

  return NextResponse.json(data, {
    headers: {
      // Autocomplete traffic can be bursty per keystroke; a short shared
      // cache takes real load off the DB for identical queries without
      // meaningfully staling results.
      "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60"
    }
  });
}
