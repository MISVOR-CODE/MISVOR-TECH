import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { CheckList, SectionTitle } from "@/components/site/Bits";
import { TiltCard } from "@/components/fx/TiltCard";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricingPage" });
  return { title: t("title"), description: t("lead") };
}

const plans = [
  { key: "pilot", beam: "128 168 224", featured: false },
  { key: "build", beam: "251 234 162", featured: true },
  { key: "partner", beam: "122 190 168", featured: false }
] as const;

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("pricingPage");

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} scene="bars" compact />

      <section className="surface-vellum px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
            {plans.map((p, i) => (
              <TiltCard key={p.key} beam={p.beam} speed={`${8 + i * 2}s`} max={4} className={p.featured ? "lg:-my-4" : ""}>
                <div className="relative z-[1] flex h-full flex-col p-8">
                  {p.featured && <span className="z2 mb-4 self-start border border-brass/70 px-2.5 py-0.5 text-xs uppercase tracking-[0.18em] text-brass-hi">{t("popular")}</span>}
                  <h2 className="z2 font-display text-3xl text-[#f6edd6]">{t(`${p.key}.name`)}</h2>
                  <p className="z1 mt-1 text-sm text-brass-hi">{t(`${p.key}.tagline`)}</p>
                  <p className="z1 mt-4 text-[0.95rem] leading-relaxed text-[#cdbf9f]">{t(`${p.key}.body`)}</p>
                  <div className="z1 mt-6">
                    <CheckList dark items={t.raw(`${p.key}.includes`) as string[]} />
                  </div>
                  <p className="z1 mt-6 font-display text-xl text-[#f6edd6]">{t(`${p.key}.price`)}</p>
                  <Link href="/contact" className={`${p.featured ? "btn-brass" : "btn-line"} z2 mt-5`}>
                    {t("cta")}
                  </Link>
                </div>
              </TiltCard>
            ))}
          </div>
          <p className="mt-10 max-w-3xl text-sm leading-relaxed text-ink/70">{t("note")}</p>
        </div>
      </section>

      <section className="surface-vellum-deep px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-4xl">
          <SectionTitle title={t("faqTitle")} />
          <dl className="mt-8 divide-y divide-brass-deep/30 border-y border-brass-deep/40">
            {(t.raw("faq") as { q: string; a: string }[]).map((f) => (
              <div key={f.q} className="py-5">
                <dt className="font-display text-xl text-ink">{f.q}</dt>
                <dd className="mt-2 text-base leading-relaxed text-ink/75">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
