import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

export const SEARCH_PAGE_SIZE = 10;
export const AUTOCOMPLETE_LIMIT = 5;

const TS_CONFIG_BY_LOCALE: Record<Locale, string> = {
  en: "english",
  es: "spanish",
  fr: "french"
};

export type SearchResult = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverMediaUrl: string | null;
  publishedAt: Date | null;
  categorySlug: string | null;
  categoryName: string | null;
  rank: number;
};

export type SearchParams = {
  q: string;
  locale: Locale;
  categorySlug?: string;
  page?: number;
  pageSize?: number;
};

export type SearchResponse = {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * Ranked full-text search over published articles, scoped to one locale.
 *
 * Uses Postgres `websearch_to_tsquery` (understands quoted phrases, `-word`
 * exclusion, and implicit AND between terms — the same input grammar users
 * already expect from a search engine) against the trigger-maintained
 * `searchVector` column (see prisma/sql/enable-search.sql). Both the SQL
 * text and the untrusted `q`/`categorySlug` values go through Prisma's
 * tagged-template `$queryRaw`, which parameterizes them — this is not
 * string concatenation and is not vulnerable to SQL injection.
 */
export async function searchArticles({
  q,
  locale,
  categorySlug,
  page = 1,
  pageSize = SEARCH_PAGE_SIZE
}: SearchParams): Promise<SearchResponse> {
  const query = q.trim();
  if (!query) {
    return { results: [], total: 0, page, pageSize };
  }

  const tsConfig = TS_CONFIG_BY_LOCALE[locale];
  const localeEnum = locale.toUpperCase(); // matches the Prisma `Locale` enum values
  const offset = Math.max(0, (page - 1) * pageSize);

  const categoryFilter = categorySlug
    ? Prisma.sql`AND c."slug" = ${categorySlug}`
    : Prisma.empty;

  const [results, totalRows] = await Promise.all([
    prisma.$queryRaw<
      Array<Omit<SearchResult, "rank" | "publishedAt"> & { rank: number; publishedAt: Date | null }>
    >(Prisma.sql`
      SELECT
        a."id",
        a."slug",
        a."title",
        a."excerpt",
        a."coverMediaUrl",
        a."publishedAt",
        c."slug" AS "categorySlug",
        c."name" AS "categoryName",
        ts_rank(a."searchVector", websearch_to_tsquery(${tsConfig}::regconfig, ${query})) AS "rank"
      FROM "Article" a
      LEFT JOIN "Category" c ON c."id" = a."categoryId"
      WHERE a."status" = 'PUBLISHED'
        AND a."locale" = ${localeEnum}::"Locale"
        AND a."searchVector" @@ websearch_to_tsquery(${tsConfig}::regconfig, ${query})
        ${categoryFilter}
      ORDER BY "rank" DESC, a."publishedAt" DESC NULLS LAST
      LIMIT ${pageSize} OFFSET ${offset}
    `),
    prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT count(*)::bigint AS "count"
      FROM "Article" a
      LEFT JOIN "Category" c ON c."id" = a."categoryId"
      WHERE a."status" = 'PUBLISHED'
        AND a."locale" = ${localeEnum}::"Locale"
        AND a."searchVector" @@ websearch_to_tsquery(${tsConfig}::regconfig, ${query})
        ${categoryFilter}
    `)
  ]);

  return {
    results: results.map((row) => ({ ...row, rank: Number(row.rank) })),
    total: Number(totalRows[0]?.count ?? 0),
    page,
    pageSize
  };
}

export type CategoryOption = {
  slug: string;
  name: string;
};

/** Categories that have at least one published article in the given locale, for the filter dropdown. */
export async function getSearchableCategories(locale: Locale): Promise<CategoryOption[]> {
  const localeEnum = locale.toUpperCase();
  const nameColumn = locale === "en" ? "nameEn" : locale === "fr" ? "nameFr" : "name";

  const rows = await prisma.$queryRaw<Array<{ slug: string; name: string | null; fallback: string }>>(
    Prisma.sql`
      SELECT DISTINCT c."slug", c.${Prisma.raw(`"${nameColumn}"`)} AS "name", c."name" AS "fallback"
      FROM "Category" c
      INNER JOIN "Article" a ON a."categoryId" = c."id"
      WHERE a."status" = 'PUBLISHED' AND a."locale" = ${localeEnum}::"Locale"
      ORDER BY c."slug"
    `
  );

  return rows.map((row) => ({ slug: row.slug, name: row.name ?? row.fallback }));
}
