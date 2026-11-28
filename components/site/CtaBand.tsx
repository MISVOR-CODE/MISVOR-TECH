import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Link } from "@/i18n/navigation";
import { Shafts } from "@/components/fx/Shafts";
import { Medallion } from "@/components/fx/Scene";

// The closing call to action, lit from above, with a struck brass seal.
export function CtaBand() {
  const t = useTranslations("cta");
  return (
    <section className="surface-night lattice overflow-hidden border-t border-brass/20">
      <Shafts
        shafts={[
          { x: "10%", w: "24%", r: "-10deg", a: "0.3", d: "15s" },
          { x: "60%", w: "28%", r: "9deg", a: "0.36", d: "18s" }
        ]}
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-14 text-center sm:px-6 lg:flex-row lg:gap-14 lg:py-20 lg:text-left">
        <Reveal variant="scale">
          <Medallion className="h-56 w-56 shrink-0 sm:h-64 sm:w-64 lg:h-72 lg:w-72" />
        </Reveal>
        <Reveal delay={0.12} className="max-w-xl">
          <h2 className="text-3xl font-medium leading-tight text-[#f6edd6] sm:text-4xl lg:text-[2.7rem]">{t("heading")}</h2>
          <p className="mt-4 text-base leading-relaxed text-[#d9ceb4] sm:text-lg">{t("body")}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Magnetic>
              <Link href="/contact" className="btn-brass">
                {t("primary")}
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/pricing" className="btn-line">
                {t("secondary")}
              </Link>
            </Magnetic>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
