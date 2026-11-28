import { Pic } from "@/components/site/Pic";
import { Reveal } from "@/components/motion/Reveal";
import { media } from "@/lib/media";
import { format } from "date-fns";
import { es, enUS, fr } from "date-fns/locale";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLatestArticles } from "@/lib/articles";
import type { Locale } from "@/i18n/routing";

const DATE_FNS_LOCALES = { en: enUS, es, fr };

export async function NewsSection() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("news");
  const publishedFallback = new Date();

  const articles = await getLatestArticles(locale);

  const items =
    articles.length > 0
      ? articles
      : Array.from({ length: 6 }).map((_, i) => ({
          id: `placeholder-${i}`,
          slug: "#",
          title: t("placeholderTitle"),
          coverMediaUrl: media.newsFallback,
          publishedAt: new Date()
        }));

  return (
    <section className="surface-vellum-deep">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <Reveal className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-medium text-ink sm:text-4xl">{t("heading")}</h2>
            <div className="rule-double mt-5 w-24" />
          </div>
          <Link href="/blog" className="hidden border-b border-brass-deep pb-0.5 text-sm font-medium text-brand-dark hover:text-oxblood sm:block">
            {t("viewAll")}
          </Link>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((article, n) => (
            <Reveal key={article.id} delay={(n % 3) * 0.09} className="h-full">
            <Link
              href={article.slug === "#" ? "#" : `/articles/${article.slug}`}
              className="plaque beam group block h-full p-3 transition hover:-translate-y-0.5"
            >
              <div className="relative h-[260px] w-full overflow-hidden border border-brass/40 sm:h-[300px]">
                <Pic
                  src={article.coverMediaUrl || media.newsFallback}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="px-2 pb-3 pt-5">
                <p className="text-sm text-[#cdbf9f]">
                  {format(article.publishedAt ?? publishedFallback, "d MMMM yyyy", {
                    locale: DATE_FNS_LOCALES[locale]
                  })}
                </p>
                <h3 className="mt-1.5 font-display text-xl leading-snug text-[#f6edd6] transition group-hover:text-brass-hi sm:text-2xl">
                  {article.title}
                </h3>
              </div>
            </Link>
            </Reveal>
          ))}
        </div>

        <Link href="/blog" className="mt-8 block text-center text-sm font-medium text-brand-dark underline sm:hidden">
          {t("viewAll")}
        </Link>
      </div>
    </section>
  );
}
