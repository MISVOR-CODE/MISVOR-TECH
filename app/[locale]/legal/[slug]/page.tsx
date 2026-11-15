import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHero } from "@/components/site/PageHero";
import { site } from "@/lib/site";

export const dynamicParams = false;
const slugs = ["notice", "privacy", "cookies", "terms"] as const;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!(slugs as readonly string[]).includes(slug)) return {};
  const t = await getTranslations({ locale, namespace: "legalPages" });
  return { title: t(`${slug}.title`) };
}

export default async function LegalPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  if (!(slugs as readonly string[]).includes(slug)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("legalPages");
  const sections = t.raw(`${slug}.sections`) as { h: string; p: string }[];
  const fill = (text: string) => text.replaceAll("{email}", site.email).replaceAll("{location}", site.location);

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t(`${slug}.title`)} lead={t(`${slug}.lead`)} compact />
      <section className="surface-vellum px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-3xl">
          {sections.map((s) => (
            <div key={s.h} className="mb-9">
              <h2 className="font-display text-2xl text-ink">{s.h}</h2>
              <p className="mt-3 text-base leading-[1.8] text-ink/80">{fill(s.p)}</p>
            </div>
          ))}
          {slug === "notice" && (site.legalName || site.taxId) && (
            <p className="text-base leading-[1.8] text-ink/80">
              {site.legalName} {site.taxId}
            </p>
          )}
          <p className="mt-10 border-t border-brass-deep/40 pt-5 text-sm text-ink/60">{t("updated")}</p>
        </div>
      </section>
    </>
  );
}
