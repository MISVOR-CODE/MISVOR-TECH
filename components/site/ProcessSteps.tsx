import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/Reveal";
import { Shafts } from "@/components/fx/Shafts";

const steps = ["discover", "prototype", "deploy", "operate"] as const;

export function ProcessSteps({ id }: { id?: string }) {
  const t = useTranslations("process");
  return (
    <section id={id} className="surface-night lattice overflow-hidden px-4 py-16 sm:px-6 lg:py-24">
      <Shafts shafts={[{ x: "30%", w: "30%", r: "-6deg", a: "0.2", d: "17s" }]} />
      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <h2 className="max-w-3xl text-3xl font-medium leading-tight text-[#f6edd6] sm:text-5xl">{t("heading")}</h2>
          <div className="rule-double mt-6 w-24" />
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#d9ceb4] sm:text-lg">{t("intro")}</p>
        </Reveal>

        <div className="rail mt-12 hidden lg:block" />
        <ol className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:mt-10 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal as="li" key={s} delay={i * 0.1}>
              <span className="font-display text-5xl leading-none text-brass/70">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-3 font-display text-2xl text-[#f6edd6]">{t(`${s}.title`)}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-[#cdbf9f]">{t(`${s}.body`)}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
