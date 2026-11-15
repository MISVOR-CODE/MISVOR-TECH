import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Shafts } from "@/components/fx/Shafts";
import { RobotWalker } from "@/components/fx/Scene";

const prompts = ["p1", "p2", "p3"] as const;

// The MISVOR AI section. The robot is a canvas over the whole section. He leans on the left wall,
// walks and flies around, and points at the button (found through data-robot-target). The empty
// band under the text is the floor he walks on.
export function MisvorAi() {
  const t = useTranslations("misvorAi");
  return (
    <section className="surface-night lattice relative flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden px-6 pb-20 pt-14 sm:px-6 lg:min-h-[calc(100svh-5rem)] lg:pb-0 lg:pt-16">
      <Shafts
        shafts={[
          { x: "8%", w: "26%", r: "-9deg", a: "0.26", d: "16s" },
          { x: "64%", w: "28%", r: "10deg", a: "0.3", d: "19s" }
        ]}
      />
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <p className="eyebrow justify-center">{t("eyebrow")}</p>
        <h2 className="mt-5 text-3xl font-medium leading-tight text-[#f6edd6] sm:text-5xl">{t("title")}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#d9ceb4] sm:text-lg">{t("body")}</p>
        <ul className="mt-6 flex flex-wrap justify-center gap-2.5">
          {prompts.map((p) => (
            <li key={p} className="border border-brass/45 bg-night/60 px-3.5 py-1.5 text-sm text-[#e4dac0]">
              {t(`prompts.${p}`)}
            </li>
          ))}
        </ul>
        <Link href="/contact" data-robot-target className="btn-brass misvor-btn mt-8">
          {t("button")}
        </Link>
      </div>
      <div data-robot-stage className="min-h-[240px] flex-1" aria-hidden />
      <RobotWalker />
    </section>
  );
}
