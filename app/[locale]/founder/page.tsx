import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { Pic } from "@/components/site/Pic";
import { SectionTitle } from "@/components/site/Bits";
import { TiltCard } from "@/components/fx/TiltCard";
import { media } from "@/lib/media";
import { founderLinks } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "founderPage" });
  return { title: t("title"), description: t("lead") };
}

const credentials = [
  { key: "msc", beam: "241 217 160", speed: "6s" },
  { key: "cisco", beam: "128 168 224", speed: "7.5s" },
  { key: "google", beam: "122 190 168", speed: "9s" },
  { key: "languages", beam: "214 126 142", speed: "8s" }
] as const;

const roles = ["hosono", "abinbev", "cisco", "rocket", "mistercomp"] as const;
const stats = ["uptime", "sites", "applicants", "cost"] as const;
const skills = ["automation", "cloud", "code", "security", "data"] as const;

export default async function FounderPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("founderPage");

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} scene="neural" compact />

      <section className="surface-vellum px-4 py-14 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12 lg:items-start">
          <div className="mx-auto w-full max-w-sm lg:col-span-4 lg:mx-0">
            <div className="relative">
              <div className="arch relative aspect-[4/5] border border-brass-deep/70 shadow-[0_30px_60px_-30px_rgba(40,26,6,0.7)]">
                <Pic src={media.founder} alt={t("name")} fill sizes="(min-width: 1024px) 28vw, 90vw" className="object-cover" />
              </div>
              <div className="arch pointer-events-none absolute -inset-2 border border-brass-deep/40" />
            </div>
            <p className="mt-6 text-center font-display text-2xl text-ink">{t("name")}</p>
            <p className="mt-0.5 text-center text-sm text-ink/65">{t("role")}</p>
            <ul className="mt-5 flex flex-wrap justify-center gap-2">
              {founderLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="border border-brass-deep/60 px-3 py-1 text-sm text-ink transition hover:bg-brass/20">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-8">
            <h2 className="text-3xl font-medium leading-tight text-ink sm:text-4xl">{t("heading")}</h2>
            <div className="rule-double mt-5 w-24" />
            <p className="mt-6 max-w-prose text-base leading-[1.8] text-ink/80 sm:text-lg">{t("body1")}</p>
            <p className="mt-4 max-w-prose text-base leading-[1.8] text-ink/80 sm:text-lg">{t("body2")}</p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s} className="plaque beam px-4 py-5 text-center">
                  <p className="relative z-[1] font-display text-3xl text-[#f6edd6]">{t(`stats.${s}.value`)}</p>
                  <p className="relative z-[1] mt-1 text-xs leading-snug text-[#cdbf9f]">{t(`stats.${s}.label`)}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {credentials.map((c) => (
                <TiltCard key={c.key} beam={c.beam} speed={c.speed} max={6}>
                  <div className="relative z-[1] p-6">
                    <p className="z2 font-display text-xl leading-snug text-[#f6edd6]">{t(`${c.key}Title`)}</p>
                    <p className="z1 mt-1 text-sm text-brass-hi">{t(`${c.key}Issuer`)}</p>
                    <p className="z1 mt-2 text-sm text-[#cdbf9f]">{t(`${c.key}Note`)}</p>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="surface-night lattice overflow-hidden px-4 py-16 sm:px-6 lg:py-24">
        <div className="relative mx-auto max-w-5xl">
          <SectionTitle dark title={t("timelineTitle")} intro={t("timelineIntro")} />
          <ol className="mt-12 space-y-0 border-l border-brass/40">
            {roles.map((r) => (
              <li key={r} className="relative pb-10 pl-8 last:pb-0">
                <span className="absolute -left-[5px] top-2 h-[9px] w-[9px] rounded-full bg-brass-hi shadow-[0_0_12px_2px_rgba(241,217,160,0.7)]" />
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-brass-hi/80">{t(`roles.${r}.when`)}</p>
                <h3 className="mt-1 font-display text-2xl text-[#f6edd6]">{t(`roles.${r}.title`)}</h3>
                <p className="text-sm text-[#cdbf9f]">{t(`roles.${r}.where`)}</p>
                <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-[#d9ceb4]">{t(`roles.${r}.body`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="surface-vellum px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionTitle title={t("skillsTitle")} />
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {skills.map((k) => (
              <div key={k} className="plaque beam p-6">
                <p className="relative z-[1] font-display text-xl text-[#f6edd6]">{t(`skills.${k}.title`)}</p>
                <p className="relative z-[1] mt-3 text-sm leading-relaxed text-[#d9ceb4]">{t(`skills.${k}.items`)}</p>
              </div>
            ))}
            <div className="plaque beam p-6">
              <p className="relative z-[1] font-display text-xl text-[#f6edd6]">{t("educationTitle")}</p>
              <p className="relative z-[1] mt-3 text-sm leading-relaxed text-[#d9ceb4]">{t("educationBody")}</p>
              <Link href="/contact" className="relative z-[1] mt-4 inline-block border-b border-brass pb-0.5 text-sm font-medium text-brass-hi hover:text-white">
                {t("contactCta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
