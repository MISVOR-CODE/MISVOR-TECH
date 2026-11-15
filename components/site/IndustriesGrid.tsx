import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ServiceIcon } from "@/components/site/icons";
import { industries } from "@/lib/content";

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
          {industries.map((i) => (
            <Link
              key={i.key}
              href={`/industries/${i.slug}`}
              className="group relative border border-brass-deep/50 bg-[#f6efdd] p-6 shadow-[0_24px_40px_-32px_rgba(40,26,6,0.7)] transition hover:-translate-y-0.5 hover:border-brass-deep hover:shadow-[0_30px_50px_-28px_rgba(40,26,6,0.85)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brass-deep/70 bg-night text-brass-hi">
                <ServiceIcon name={i.icon} className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-xl leading-snug text-ink transition group-hover:text-oxblood">{tInd(`${i.key}.title`)}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{tInd(`${i.key}.short`)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
