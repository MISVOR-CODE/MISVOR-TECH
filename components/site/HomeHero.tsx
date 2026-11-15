import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HeroVideo } from "@/components/site/HeroVideo";
import { Shafts } from "@/components/fx/Shafts";
import { TiltCard } from "@/components/fx/TiltCard";
import { Scene3D } from "@/components/fx/Scene";
import { ServiceIcon } from "@/components/site/icons";
import { solutions } from "@/lib/content";

const promo = ["aiAgents", "workflowAutomation", "documentIntelligence", "dataAnalytics"] as const;
const speeds = ["9s", "11s", "10s", "12s"];

const delay = (s: string) => ({ "--delay": s }) as CSSProperties;

// The home hero. Video plays behind everything, the globe sits to the right and stays
// draggable because only the text blocks, not the whole column, take pointer events.
export function HomeHero() {
  const t = useTranslations("hero");
  const tSol = useTranslations("solutionPages");

  return (
    <section id="hero-promo" className="surface-night lattice relative -mt-16 flex min-h-[740px] flex-col overflow-hidden sm:min-h-[800px] lg:-mt-20 lg:min-h-[880px]">
      <HeroVideo />
      <div className="hero-scrim" />
      <Shafts />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-night to-transparent" />

      <div className="absolute inset-x-0 top-24 h-[420px] opacity-35 sm:top-20 sm:h-[520px] sm:opacity-60 lg:inset-x-auto lg:right-[2%] lg:top-20 lg:h-[680px] lg:w-[680px] lg:opacity-100">
        <Scene3D kind="armillary" className="h-full w-full" />
      </div>

      <div className="pointer-events-none relative flex flex-1 flex-col justify-end px-4 pb-8 pt-36 sm:px-6 lg:pb-12">
        <div className="mx-auto w-full max-w-7xl">
          <p className="eyebrow rise pointer-events-auto" style={delay("0.05s")}>
            {t("eyebrow")}
          </p>
          <h1
            className="rise pointer-events-auto mt-6 max-w-xl text-[2.7rem] font-medium leading-[1.02] text-[#f6edd6] sm:max-w-2xl sm:text-6xl lg:max-w-[41rem] lg:text-[4.8rem]"
            style={delay("0.2s")}
          >
            {t("headline")}
          </h1>
          <p className="rise pointer-events-auto mt-6 max-w-lg text-base leading-relaxed text-[#d9ceb4] sm:text-lg" style={delay("0.45s")}>
            {t("lead")}
          </p>
          <div className="rise pointer-events-auto mt-8 flex flex-wrap gap-3" style={delay("0.65s")}>
            <Link href="/contact" className="btn-brass">
              {t("primary")}
            </Link>
            <Link href="/solutions" className="btn-line">
              {t("secondary")}
            </Link>
          </div>

          <div className="rise pointer-events-auto mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-4" style={delay("0.85s")}>
            {promo.map((key, i) => {
              const s = solutions.find((x) => x.key === key)!;
              return (
                <TiltCard key={key} beam={s.beam} speed={speeds[i]} max={7}>
                  <Link href={`/solutions/${s.slug}`} className="relative z-[1] flex items-center gap-4 px-5 py-5">
                    <span className="z2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brass/60 text-brass-hi">
                      <ServiceIcon name={s.icon} className="h-6 w-6" />
                    </span>
                    <span className="z1 text-left leading-tight">
                      <span className="block font-display text-xl text-[#f6edd6]">{tSol(`${key}.title`)}</span>
                      <span className="mt-0.5 block text-sm text-[#cdbf9f]">{t(`card.${key}`)}</span>
                    </span>
                  </Link>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
