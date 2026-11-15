import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { format } from "date-fns";
import { es, enUS, fr } from "date-fns/locale";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { searchArticles, getSearchableCategories, SEARCH_PAGE_SIZE } from "@/lib/search";

const DATE_FNS_LOCALES = { en: enUS, es, fr };

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "search" });
  return { title: t("pageTitle") };
}

export default async function SearchPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as Locale;
  setRequestLocale(locale);

  const { q = "", category, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);

  const t = await getTranslations("search");

  const [{ results, total }, categories] = await Promise.all([
    searchArticles({ q, locale, categorySlug: category, page }),
    getSearchableCategories(locale)
  ]);

  const totalPages = Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE));
  const dateLocale = DATE_FNS_LOCALES[locale];

  function pageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return `/search${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{t("pageTitle")}</h1>

      {/* Query + category filter — a plain GET form, so this page works
          identically with JavaScript disabled and is fully bookmarkable/shareable. */}
      <form
        method="GET"
        className="mt-6 flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 sm:flex-row sm:items-center"
      >
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={t("placeholder")}
          className="flex-1 rounded-full border border-black/10 px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-brand focus:outline-none"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          aria-label={t("filterByCategory")}
          className="rounded-full border border-black/10 px-4 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
        >
          <option value="">{t("allCategories")}</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          {t("searchButton")}
        </button>
      </form>

      {q.trim() && (
        <p className="mt-6 text-sm text-ink/60">
          {t("resultsFor", { query: q.trim() })} · {t("resultsCount", { count: total })}
        </p>
      )}

      {q.trim() && results.length === 0 && (
        <div className="mt-10 text-center">
          <p className="text-ink/70">{t("noResults")}</p>
          <p className="mt-1 text-sm text-ink/50">{t("emptyStateHint")}</p>
        </div>
      )}

      {!q.trim() && <p className="mt-10 text-center text-ink/50">{t("startTyping")}</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {results.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.slug}`}
            className="flex gap-4 overflow-hidden rounded-xl border border-brand/20 bg-white p-3 transition hover:border-brand hover:shadow-sm"
          >
            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-brand-light/40">
              {article.coverMediaUrl && (
                <Image src={article.coverMediaUrl} alt="" fill sizes="112px" className="object-cover" />
              )}
            </div>
            <div className="min-w-0">
              {article.categoryName && (
                <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                  {article.categoryName}
                </p>
              )}
              <h2 className="mt-0.5 truncate text-sm font-semibold text-ink">{article.title}</h2>
              <p className="mt-1 line-clamp-2 text-xs text-ink/60">{article.excerpt}</p>
              {article.publishedAt && (
                <p className="mt-1 text-xs text-ink/40">
                  {format(article.publishedAt, "d MMM yyyy", { locale: dateLocale })}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-4 text-sm">
          <Link
            href={pageHref(Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={`font-semibold ${page <= 1 ? "pointer-events-none text-ink/30" : "text-brand-dark hover:underline"}`}
          >
            {t("prevPage")}
          </Link>
          <span className="text-ink/60">{t("pageOf", { page, totalPages })}</span>
          <Link
            href={pageHref(Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={`font-semibold ${page >= totalPages ? "pointer-events-none text-ink/30" : "text-brand-dark hover:underline"}`}
          >
            {t("nextPage")}
          </Link>
        </nav>
      )}
    </div>
  );
}
