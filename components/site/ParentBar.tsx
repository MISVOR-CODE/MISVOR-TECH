import { getTranslations } from "next-intl/server";
import { site } from "@/lib/site";

// A slim bar above the header that leads back to the parent site, the same as the
// one on MISVOR Build. It scrolls away; the header below stays pinned.
export async function ParentBar() {
  const t = await getTranslations("parentBar");
  return (
    <div className="relative z-[60] border-b border-brass/25 bg-[#050b14]">
      <div className="mx-auto flex h-10 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href={site.mainSite}
          className="inline-flex items-center gap-2 border border-brass/60 px-3 py-1 font-display text-[0.9rem] text-[#f6e0a0] transition hover:bg-brass/15 hover:text-white"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t("back")}
        </a>
        <p className="hidden font-display text-[0.9rem] text-[#cdbf9f] md:block">{t("tagline")}</p>
      </div>
    </div>
  );
}
