import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { CheckList, SectionTitle } from "@/components/site/Bits";
import { ServiceIcon } from "@/components/site/icons";
import { TiltCard } from "@/components/fx/TiltCard";
import { Shafts } from "@/components/fx/Shafts";
import { industryByKey, solutionBySlug, solutions } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => solutions.map((s) => ({ locale, slug: s.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = solutionBySlug(slug);
  if (!s) return {};
  const t = await getTranslations({ locale, namespace: "solutionPages" });
  return { title: t(`${s.key}.title`), description: t(`${s.key}.short`) };
}

export default async function SolutionPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const s = solutionBySlug(slug);
  if (!s) notFound();

  const t = await getTranslations("solutionPages");
  const tl = await getTranslations("pageLabels");
  const tInd = await getTranslations("industryPages");
  const build = t.raw(`${s.key}.build`) as string[];
  const steps = t.raw(`${s.key}.steps`) as string[];

  return (
    <>
      <PageHero eyebrow={tl("solutionsEyebrow")} title={t(`${s.key}.title`)} lead={t(`${s.key}.lead`)} scene={s.scene}>
        <Link href="/contact" className="btn-brass">
          {tl("startProject")}
        </Link>
        <Link href="/pricing" className="btn-line">
          {tl("seePlans")}
        </Link>
      </PageHero>

      <section className="surface-vellum px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div>
            <SectionTitle title={tl("overview")} />
            <p className="mt-6 max-w-prose text-base leading-[1.8] text-ink/80 sm:text-lg">{t(`${s.key}.overview`)}</p>
            <div className="mt-8 border-l-2 border-brass-deep pl-5">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink/55">{tl("outcome")}</p>
              <p className="mt-1.5 font-display text-xl leading-snug text-ink">{t(`${s.key}.outcome`)}</p>
            </div>
          </div>
          <div>
            <h3 className="font-display text-2xl text-ink">{tl("whatWeBuild")}</h3>
            <div className="mt-5">
              <CheckList items={build} />
            </div>
            <p className="mt-9 text-xs font-medium uppercase tracking-[0.2em] text-ink/55">{tl("typicalStack")}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {s.stack.map((tag) => (
                <li key={tag} className="border border-brass-deep/50 bg-[#f6efdd] px-3 py-1 text-sm text-ink">
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="surface-night lattice overflow-hidden px-4 py-16 sm:px-6 lg:py-20">
        <Shafts shafts={[{ x: "55%", w: "30%", r: "8deg", a: "0.22", d: "16s" }]} />
        <div className="relative mx-auto max-w-7xl">
          <SectionTitle dark title={tl("howItWorks")} intro={tl("howItWorksIntro")} />
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {steps.map((step, i) => (
              <TiltCard key={i} beam={s.beam} speed={`${9 + i}s`} max={5}>
                <div className="relative z-[1] p-7">
                  <span className="z2 font-display text-4xl leading-none text-brass/70">{String(i + 1).padStart(2, "0")}</span>
                  <p className="z1 mt-4 text-base leading-relaxed text-[#e4dac0]">{step}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      <section className="surface-vellum px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionTitle title={tl("relatedIndustries")} />
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {s.industries.map((k) => {
              const ind = industryByKey(k)!;
              return (
                <Link
                  key={k}
                  href={`/industries/${ind.slug}`}
                  className="group border border-brass-deep/50 bg-[#f6efdd] p-6 transition hover:-translate-y-0.5 hover:border-brass-deep"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brass-deep/70 bg-night text-brass-hi">
                    <ServiceIcon name={ind.icon} className="h-5 w-5" />
                  </span>
                  <p className="mt-4 font-display text-xl text-ink group-hover:text-oxblood">{tInd(`${k}.title`)}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{tInd(`${k}.short`)}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
