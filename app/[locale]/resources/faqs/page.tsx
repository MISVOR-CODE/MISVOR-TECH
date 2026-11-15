import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { NewsSection } from "@/components/site/NewsSection";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faqPage" });
  return { title: t("title"), description: t("lead") };
}

export const revalidate = 60;

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("faqPage");
  const items = t.raw("items") as { q: string; a: string }[];

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} compact />
      <section className="surface-vellum px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-3xl divide-y divide-brass-deep/30 border-y border-brass-deep/40">
          {items.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl text-ink">
                {f.q}
                <span className="text-brass-deep transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-base leading-relaxed text-ink/75">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      <NewsSection />
      <CtaBand />
    </>
  );
}
