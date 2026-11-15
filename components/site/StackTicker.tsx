import { useTranslations } from "next-intl";
import { stackTicker } from "@/lib/content";

export function StackTicker() {
  const t = useTranslations("stack");
  const items = [...stackTicker, ...stackTicker];
  return (
    <section className="surface-vellum-deep overflow-hidden border-y border-brass-deep/40 py-10">
      <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.25em] text-ink/60">{t("heading")}</p>
      <div className="relative">
        <div className="marquee" aria-hidden>
          {items.map((name, i) => (
            <span key={i} className="mx-3 shrink-0 border border-brass-deep/50 bg-[#f6efdd] px-5 py-2 font-display text-lg text-ink">
              {name}
            </span>
          ))}
        </div>
        <ul className="sr-only">
          {stackTicker.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-vellum-deep to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-vellum-deep to-transparent" />
      </div>
    </section>
  );
}
