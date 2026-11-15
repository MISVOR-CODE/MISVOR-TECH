import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { ProcessSteps } from "@/components/site/ProcessSteps";
import { SectionTitle } from "@/components/site/Bits";
import { TiltCard } from "@/components/fx/TiltCard";
import { cities } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutPage" });
  return { title: t("title"), description: t("lead") };
}

const values = ["useful", "yours", "human", "handover"] as const;

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("aboutPage");
  const tc = await getTranslations("cities");

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} scene="globe" />

      <section className="surface-vellum px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SectionTitle title={t("storyTitle")} />
            <p className="mt-6 max-w-prose text-base leading-[1.8] text-ink/80 sm:text-lg">{t("story1")}</p>
            <p className="mt-4 max-w-prose text-base leading-[1.8] text-ink/80 sm:text-lg">{t("story2")}</p>
            <Link href="/founder" className="btn-brass mt-8">
              {t("founderCta")}
            </Link>
          </div>
          <div className="lg:col-span-2">
            <h3 className="font-display text-2xl text-ink">{t("whereTitle")}</h3>
            <p className="mt-3 text-base leading-relaxed text-ink/75">{t("whereBody")}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {cities.map((c) => (
                <li key={c.key} className="border border-brass-deep/50 bg-[#f6efdd] px-3 py-1 text-sm text-ink">
                  {tc(c.key)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="surface-night lattice overflow-hidden px-4 py-16 sm:px-6 lg:py-24">
        <div className="relative mx-auto max-w-7xl">
          <SectionTitle dark title={t("valuesTitle")} intro={t("valuesIntro")} />
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <TiltCard key={v} speed={`${8 + i}s`} max={6}>
                <div className="relative z-[1] p-7">
                  <p className="z2 font-display text-2xl text-[#f6edd6]">{t(`values.${v}.title`)}</p>
                  <p className="z1 mt-3 text-[0.95rem] leading-relaxed text-[#cdbf9f]">{t(`values.${v}.body`)}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      <ProcessSteps />
      <CtaBand />
    </>
  );
}
