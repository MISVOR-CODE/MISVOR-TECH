import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es, enUS, fr } from "date-fns/locale";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/site/PageHero";
import { Pic } from "@/components/site/Pic";
import { getArticlesPage } from "@/lib/articles";
import { media } from "@/lib/media";

export const revalidate = 60;
const DATE_FNS_LOCALES = { en: enUS, es, fr };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blogPage" });
  return { title: t("title"), description: t("lead") };
}

export default async function BlogPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ page?: string }> }) {
  const { locale: raw } = await params;
  if (!hasLocale(routing.locales, raw)) notFound();
  const locale = raw as Locale;
  setRequestLocale(locale);
  const page = Math.max(1, Number((await searchParams).page ?? "1") || 1);
  const t = await getTranslations("blogPage");
  const { items, pages } = await getArticlesPage(locale, page);

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} compact />
      <section className="surface-vellum-deep px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-7xl">
          {items.length === 0 ? (
            <p className="mx-auto max-w-md text-center text-[#cdbf9f]">{t("empty")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((a) => (
                <Link
                  key={a.id}
                  href={`/articles/${a.slug}`}
                  className="plaque beam group p-3 transition hover:-translate-y-0.5"
                >
                  <div className="relative h-[240px] w-full overflow-hidden border border-brass/40">
                    <Pic src={a.coverMediaUrl || media.newsFallback} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
                  </div>
                  <div className="px-2 pb-3 pt-5">
                    {a.publishedAt && <p className="text-sm text-[#cdbf9f]">{format(a.publishedAt, "d MMMM yyyy", { locale: DATE_FNS_LOCALES[locale] })}</p>}
                    <h2 className="mt-1.5 font-display text-xl leading-snug text-[#f6edd6] group-hover:text-brass-hi sm:text-2xl">{a.title}</h2>
                    {a.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#cdbf9f]">{a.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
          {pages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-6 text-sm" aria-label="Pagination">
              {page > 1 && (
                <Link href={`/blog?page=${page - 1}`} className="border-b border-brass-deep pb-0.5 text-brand-dark hover:text-oxblood">
                  {t("prev")}
                </Link>
              )}
              <span className="text-[#cdbf9f]">{t("pageOf", { page, pages })}</span>
              {page < pages && (
                <Link href={`/blog?page=${page + 1}`} className="border-b border-brass-deep pb-0.5 text-brand-dark hover:text-oxblood">
                  {t("next")}
                </Link>
              )}
            </nav>
          )}
        </div>
      </section>
    </>
  );
}
