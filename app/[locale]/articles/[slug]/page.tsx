import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { MediaBlock } from "@/components/MediaBlock";
import { routing, type Locale } from "@/i18n/routing";
import type { ArticleDTO } from "@/types";

export const revalidate = 60;

// No paths are prebuilt (articles are created after deploy). Returning an empty
// list opts the route into on-demand static generation: the first request for
// a slug renders and caches it, later requests are served from the cache and
// refreshed at most once per `revalidate` window instead of querying the DB
// on every hit.
export function generateStaticParams() {
  return [];
}

export default async function ArticlePage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as Locale;
  setRequestLocale(locale);

  const article = await prisma.article.findUnique({
    where: { slug },
    include: { category: true, media: { orderBy: { position: "asc" } } }
  });

  if (!article || article.status !== "PUBLISHED") notFound();

  const dto = article as unknown as ArticleDTO;
  const categoryName =
    locale === "en"
      ? (dto.category?.nameEn ?? dto.category?.name)
      : locale === "fr"
        ? (dto.category?.nameFr ?? dto.category?.name)
        : dto.category?.name;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {categoryName && (
        <span className="mb-3 inline-block rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-medium text-brand-dark">
          {categoryName}
        </span>
      )}
      <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">{dto.title}</h1>
      <p className="mt-2 text-ink/60">{dto.excerpt}</p>

      {dto.coverMediaUrl && (
        <div className="mt-6">
          <MediaBlock
            url={dto.coverMediaUrl}
            type={dto.coverMediaType}
            alt={dto.title}
            priority
            gallery={dto.media}
          />
        </div>
      )}

      <div
        className="prose-article mt-8 max-w-none"
        dangerouslySetInnerHTML={{ __html: dto.body }}
      />
    </article>
  );
}
