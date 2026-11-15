"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

const LOCALE_LABELS: Record<Locale, { flag: string; short: string; full: string }> = {
  es: { flag: "🇪🇸", short: "ES", full: "Español" },
  en: { flag: "🇬🇧", short: "EN", full: "English" },
  fr: { flag: "🇫🇷", short: "FR", full: "Français" }
};

export function LanguageSwitcher() {
  const t = useTranslations("header");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchTo(nextLocale: Locale) {
    setOpen(false);
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div ref={ref} className="relative">
      <button
        aria-label={t("language")}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 border border-brass/40 px-2.5 py-1.5 text-sm font-medium text-[#efe6d0] transition hover:border-brass hover:text-brass-hi"
      >
        <span aria-hidden>{LOCALE_LABELS[locale].flag}</span>
        <span>{LOCALE_LABELS[locale].short}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-40 border border-brass/40 bg-night p-1.5 shadow-[0_24px_40px_-16px_rgba(0,0,0,0.9)]">
          {routing.locales.map((l) => (
            <button
              key={l}
              onClick={() => switchTo(l)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                l === locale ? "bg-brass/20 font-semibold text-brass-hi" : "text-[#d9ceb4] hover:bg-brass/10"
              }`}
            >
              <span aria-hidden>{LOCALE_LABELS[l].flag}</span>
              {LOCALE_LABELS[l].full}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
