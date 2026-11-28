import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/Reveal";
import { Link } from "@/i18n/navigation";
import { TiltCard } from "@/components/fx/TiltCard";
import { ServiceIcon, } from "@/components/site/icons";
import { solutions } from "@/lib/content";

export function Capabilities() {
  const t = useTranslations("capabilities");
  const tSol = useTranslations("solutionPages");
  return (
    <section className="surface-vellum px-4 py-14 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <h2 className="max-w-3xl text-3xl font-medium leading-tight text-ink sm:text-4xl">{t("heading")}</h2>
          <div className="rule-double mt-5 w-24" />
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink/75 sm:text-lg">{t("intro")}</p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {solutions.map((s, i) => (
            <Reveal key={s.key} delay={(i % 3) * 0.09} className="h-full">
            <TiltCard className="h-full" beam={s.beam} speed={`${8 + (i % 4)}s`}>
              <Link href={`/solutions/${s.slug}`} className="relative z-[1] flex h-full flex-col items-start gap-4 p-7">
                <span className="z2 flex h-14 w-14 items-center justify-center rounded-full border border-brass/70 bg-lamp text-brass-hi shadow-[0_0_30px_-8px_rgba(251,234,162,0.5)]">
                  <ServiceIcon name={s.icon} className="h-7 w-7" />
                </span>
                <p className="z1 font-display text-2xl leading-tight text-[#f6edd6]">{tSol(`${s.key}.title`)}</p>
                <p className="z1 text-sm leading-relaxed text-[#cdbf9f]">{tSol(`${s.key}.short`)}</p>
                <ul className="z1 mt-auto flex flex-wrap gap-2 pt-3">
                  {s.stack.slice(0, 3).map((tag) => (
                    <li key={tag} className="border px-2 py-0.5 text-xs text-[#e6dcc2]" style={{ borderColor: `rgb(${s.beam} / 0.4)` }}>
                      {tag}
                    </li>
                  ))}
                </ul>
                <span className="z1 inline-flex items-center gap-1.5 text-sm text-brass-hi">
                  {t("learnMore")}
                  <ServiceIcon name="arrow" className="h-4 w-4" />
                </span>
              </Link>
            </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
