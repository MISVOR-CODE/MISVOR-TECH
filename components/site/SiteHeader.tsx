"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { primaryNav } from "@/lib/navigation";
import { SearchBar } from "@/components/site/SearchBar";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { site } from "@/lib/site";
import { Logo } from "@/components/site/Logo";

// Pages that open on a light background instead of a hero. The glass bar gets a firmer tint there.
const PLAIN_PAGES = /^\/(articles|search|preferences)(\/|$)/;

const glints: { w: string; end: string; d: string; o: string; rev?: boolean }[] = [
  { w: "16%", end: "620%", d: "9s", o: "0s" },
  { w: "9%", end: "1100%", d: "13s", o: "-5s", rev: true },
  { w: "24%", end: "410%", d: "17s", o: "-11s" }
];

export function NavBeam() {
  return (
    <div className="nav-beam" aria-hidden>
      {glints.map((g, i) => (
        <i key={i} className={g.rev ? "rev" : ""} style={{ "--w": g.w, "--end": g.end, "--d": g.d, "--o": g.o } as CSSProperties} />
      ))}
    </div>
  );
}

export function SiteHeader() {
  const t = useTranslations("nav");
  const tAll = useTranslations();
  const tHeader = useTranslations("header");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [openDesktop, setOpenDesktop] = useState<string | null>(null);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const plain = PLAIN_PAGES.test(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const label = (item: { key: string; labelNs?: string }) => (item.labelNs ? tAll(`${item.labelNs}.${item.key}`) : t(item.key));

  return (
    <>
      <header
        className="glass-bar sticky top-0 z-50"
        data-scrolled={scrolled || plain ? "true" : "false"}
        style={plain ? { background: "rgb(8 18 31 / 0.94)" } : undefined}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20">
          <div className="flex shrink-0 items-center">
            {/* The MISVOR logo goes to the parent site. The TECH label stays on this site. */}
            <a href={site.mainSite} aria-label="MISVOR main site (misvor.com)" className="flex items-center">
              <Logo />
            </a>
            <span aria-hidden className="mx-3 h-6 w-px bg-brass/70 sm:mx-4" />
            <Link
              href="/"
              aria-label="MISVOR Tech home"
              className="text-[0.72rem] font-medium tracking-[0.26em] text-[#f6e0a0] uppercase transition hover:text-white sm:text-[0.8rem]"
            >
              Tech
            </Link>
          </div>

          {desktopSearchOpen ? (
            <div className="hidden flex-1 items-center gap-3 lg:flex">
              <div className="flex-1">
                <SearchBar onClose={() => setDesktopSearchOpen(false)} />
              </div>
              <button aria-label={tHeader("closeMenu")} onClick={() => setDesktopSearchOpen(false)} className="rounded-full p-2 text-[#efe6d0] hover:bg-white/10">
                <CloseIcon />
              </button>
            </div>
          ) : (
            <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
              {primaryNav.map((item) => (
                <div key={item.key} className="relative flex h-16 items-center lg:h-20" onMouseEnter={() => setOpenDesktop(item.key)} onMouseLeave={() => setOpenDesktop(null)}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 whitespace-nowrap px-3 py-2 text-sm font-medium tracking-wide text-[#efe6d0] transition hover:text-brass-hi"
                  >
                    {t(item.key)}
                    {item.children && <ChevronDown />}
                  </Link>
                  {item.children && openDesktop === item.key && (
                    <div className="glass-panel absolute left-0 top-full z-50 w-72 border border-brass/40 p-2 shadow-[0_24px_40px_-16px_rgba(0,0,0,0.9)]">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setOpenDesktop(null)}
                          className="block px-3 py-2 text-sm text-[#e4dac0] transition hover:bg-brass/15 hover:text-brass-hi"
                        >
                          {label(child)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          )}

          {!desktopSearchOpen && (
            <div className="hidden items-center gap-2 lg:flex">
              <LanguageSwitcher />
              <button aria-label={tHeader("search")} onClick={() => setDesktopSearchOpen(true)} className="rounded-full p-2 text-[#efe6d0] hover:bg-white/10">
                <SearchIcon />
              </button>
              <div className="hidden xl:block">
                <Link href="/contact" className="btn-brass !px-4 !py-2 text-sm">
                  {tHeader("quote")}
                </Link>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-[#efe6d0] lg:hidden">
            <button aria-label={tHeader("search")} onClick={() => setMobileSearchOpen(true)} className="rounded-full p-2">
              <SearchIcon />
            </button>
            <button aria-label={tHeader("openMenu")} onClick={() => setMobileOpen(true)} className="flex h-10 w-10 items-center justify-center">
              <MenuIcon />
            </button>
          </div>
        </div>
        <NavBeam />
      </header>

      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[70] bg-night p-4 text-[#efe6d0] lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchBar onClose={() => setMobileSearchOpen(false)} />
            </div>
            <button aria-label={tHeader("closeMenu")} onClick={() => setMobileSearchOpen(false)} className="flex h-10 w-10 items-center justify-center">
              <CloseIcon />
            </button>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="glass-panel absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col border-l border-brass/40 text-[#efe6d0] shadow-xl">
            <div className="flex items-center justify-between border-b border-brass/30 px-4 py-4">
              <span className="font-display text-xl text-brass-hi">{tHeader("menu")}</span>
              <div className="flex items-center gap-1">
                <LanguageSwitcher />
                <button aria-label={tHeader("closeMenu")} onClick={() => setMobileOpen(false)} className="flex h-9 w-9 items-center justify-center">
                  <CloseIcon />
                </button>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3">
              {primaryNav.map((item) => (
                <div key={item.key} className="border-b border-brass/15">
                  <div className="flex items-center justify-between">
                    <Link href={item.href} onClick={() => setMobileOpen(false)} className="flex-1 px-3 py-3 text-base">
                      {t(item.key)}
                    </Link>
                    {item.children && (
                      <button
                        aria-label={t(item.key)}
                        aria-expanded={openMobileGroup === item.key}
                        onClick={() => setOpenMobileGroup(openMobileGroup === item.key ? null : item.key)}
                        className="px-3 py-3"
                      >
                        <span className={`block transition-transform ${openMobileGroup === item.key ? "rotate-180" : ""}`}>
                          <ChevronDown />
                        </span>
                      </button>
                    )}
                  </div>
                  {item.children && openMobileGroup === item.key && (
                    <div className="pb-2 pl-6">
                      {item.children.map((child) => (
                        <Link key={child.href} href={child.href} onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-[#d9ceb4] hover:text-brass-hi">
                          {label(child)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="border-t border-brass/30 p-4">
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="btn-brass w-full">
                {tHeader("quote")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
