import { NextRequest, NextResponse } from "next/server";
import { routing, type Locale } from "@/i18n/routing";
import { getSearchableCategories } from "@/lib/search";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale");
  const locale = routing.locales.includes(localeParam as Locale)
    ? (localeParam as Locale)
    : routing.defaultLocale;

  const categories = await getSearchableCategories(locale);

  return NextResponse.json(
    { categories },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600" } }
  );
}
