import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ServiceIcon } from "@/components/site/icons";
import { industries } from "@/lib/content";

// Gold, blue, green and rose: the same four beam colours the service cards use.
const BEAMS = ["241 217 160", "128 168 224", "122 190 168", "214 126 142"];

export function IndustriesGrid({ withHeading = true }: { withHeading?: boolean }) {
  const t = useTranslations("industriesSection");
  const tInd = useTranslations("industryPages");
  return (
    <section className="surface-vellum px-4 py-14 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        {withHeading && (
          <>
            <h2 className="max-w-3xl text-3xl font-medium leading-tight text-ink sm:text-4xl">{t("heading")}</h2>
            <div className="rule-double mt-5 w-24" />
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink/75 sm:text-lg">{t("intro")}</p>
          </>
        )}
        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 ${withHeading ? "mt-10" : ""}`}>
          {industries.map((i, n) => (
            <Link
              key={i.key}
              href={`/industries/${i.slug}`}
              className="plaque beam group relative p-6 transition hover:-translate-y-0.5"
              style={{ "--beam": BEAMS[n % BEAMS.length], "--beam-speed": `${8 + (n % 4)}s` } as CSSProperties}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brass/60 bg-night/70 text-brass-hi">
                <ServiceIcon name={i.icon} className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-xl leading-snug text-[#f6edd6] transition group-hover:text-brass-hi">{tInd(`${i.key}.title`)}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#cdbf9f]">{tInd(`${i.key}.short`)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
