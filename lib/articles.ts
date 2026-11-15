import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

/**
 * Latest published articles for a locale (home page news strip).
 *
 * The home page is prerendered at build time. There the database can
 * legitimately be unreachable (a Docker image build, or the very first deploy
 * before migrations ran). Only in that phase we fall back to an empty list and
 * let ISR fill in real data on the first revalidation. At runtime errors are
 * rethrown so an outage is never silently replaced with placeholder content.
 *
 * Local development is the other exception: without a DATABASE_URL the site
 * would not open at all, so there we warn and show the placeholders instead.
 */
function mayFallBack() {
  return process.env.NEXT_PHASE === "phase-production-build" || process.env.NODE_ENV === "development";
}

export async function getLatestArticles(locale: Locale, take = 6) {
  try {
    return await prisma.article.findMany({
      where: { status: "PUBLISHED", locale: locale.toUpperCase() as "EN" | "ES" | "FR" },
      orderBy: { publishedAt: "desc" },
      take
    });
  } catch (error) {
    if (mayFallBack()) {
      console.warn("[news] Database unavailable (is DATABASE_URL set?). Showing placeholder news.");
      return [];
    }
    throw error;
  }
}

export const BLOG_PAGE_SIZE = 9;

/** One page of published articles for the blog index, newest first. */
export async function getArticlesPage(locale: Locale, page = 1, take = BLOG_PAGE_SIZE) {
  const where = { status: "PUBLISHED" as const, locale: locale.toUpperCase() as "EN" | "ES" | "FR" };
  try {
    const [items, total] = await Promise.all([
      prisma.article.findMany({ where, orderBy: { publishedAt: "desc" }, skip: (page - 1) * take, take }),
      prisma.article.count({ where })
    ]);
    return { items, total, pages: Math.max(1, Math.ceil(total / take)) };
  } catch (error) {
    if (mayFallBack()) {
      console.warn("[blog] Database unavailable (is DATABASE_URL set?). Showing the empty state.");
      return { items: [], total: 0, pages: 1 };
    }
    throw error;
  }
}
