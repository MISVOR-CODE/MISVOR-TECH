import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { CheckList, Framed, SectionTitle } from "@/components/site/Bits";
import { TiltCard } from "@/components/fx/TiltCard";
import { Shafts } from "@/components/fx/Shafts";
import { ServiceIcon } from "@/components/site/icons";
import { industries, industryBySlug, solutionByKey } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => industries.map((i) => ({ locale, slug: i.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const i = industryBySlug(slug);
  if (!i) return {};
  const t = await getTranslations({ locale, namespace: "industryPages" });
  return { title: t(`${i.key}.title`), description: t(`${i.key}.short`) };
}

export default async function IndustryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const ind = industryBySlug(slug);
  if (!ind) notFound();

  const t = await getTranslations("industryPages");
  const tl = await getTranslations("pageLabels");
  const tSol = await getTranslations("solutionPages");
  const automate = t.raw(`${ind.key}.automate`) as string[];
  const related = ind.solutions.map((k) => solutionByKey(k)!);

  return (
    <>
      <PageHero eyebrow={tl("industriesEyebrow")} title={t(`${ind.key}.title`)} lead={t(`${ind.key}.lead`)} scene={ind.scene}>
        <Link href="/contact" className="btn-brass">
          {tl("startProject")}
        </Link>
      </PageHero>

      <section className="surface-vellum px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div>
            <SectionTitle title={tl("overview")} />
            <p className="mt-6 max-w-prose text-base leading-[1.8] text-ink/80 sm:text-lg">{t(`${ind.key}.overview`)}</p>
          </div>
          <div>
            <h3 className="font-display text-2xl text-ink">{tl("whatWeAutomate")}</h3>
            <div className="mt-5">
              <CheckList items={automate} />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-7xl">
          <Framed>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#cdbf9f]">{tl("example")}</p>
            <p className="mt-3 max-w-3xl font-display text-2xl leading-snug text-[#f6edd6] sm:text-[1.7rem]">{t(`${ind.key}.example`)}</p>
          </Framed>
        </div>
      </section>

      <section className="surface-night lattice overflow-hidden px-4 py-16 sm:px-6 lg:py-20">
        <Shafts shafts={[{ x: "10%", w: "28%", r: "-8deg", a: "0.22", d: "17s" }]} />
        <div className="relative mx-auto max-w-7xl">
          <SectionTitle dark title={tl("relatedSolutions")} />
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {related.map((s, i) => (
              <TiltCard key={s.key} beam={s.beam} speed={`${9 + i}s`}>
                <Link href={`/solutions/${s.slug}`} className="relative z-[1] flex h-full flex-col items-start gap-4 p-7">
                  <span className="z2 flex h-12 w-12 items-center justify-center rounded-full border border-brass/60 text-brass-hi">
                    <ServiceIcon name={s.icon} className="h-6 w-6" />
                  </span>
                  <p className="z1 font-display text-2xl text-[#f6edd6]">{tSol(`${s.key}.title`)}</p>
                  <p className="z1 text-sm leading-relaxed text-[#cdbf9f]">{tSol(`${s.key}.short`)}</p>
                </Link>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
