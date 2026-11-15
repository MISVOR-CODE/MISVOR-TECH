import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { footerNav, legalNav, socialLinks } from "@/lib/navigation";
import { NewsletterSection } from "@/components/site/NewsletterSection";
import { Logo } from "@/components/site/Logo";
import { site } from "@/lib/site";

export function SiteFooter() {
  const t = useTranslations("nav");
  const tAll = useTranslations();
  const tFooter = useTranslations("footer");
  const tLegal = useTranslations("legal");

  return (
    <footer id="site-footer" className="surface-night lattice text-[#cdbf9f]">
      <NewsletterSection />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs font-display text-lg italic text-brass-hi/90">{tFooter("tagline")}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed">{tFooter("blurb")}</p>
          </div>

          {footerNav.map((group) => (
            <div key={group.headingKey}>
              <p className="font-display text-lg text-[#f6edd6]">{tFooter(group.headingKey)}</p>
              <div className="rule-double mt-2 w-10" />
              <ul className="mt-4 space-y-2 text-sm">
                {group.links.map((link) => (
                  <li key={link.key}>
                    <Link href={link.href} className="transition hover:text-brass-hi">
                      {link.labelNs ? tAll(`${link.labelNs}.${link.key}`) : t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-brass/25 pt-8 text-sm sm:flex-row sm:items-center sm:gap-8">
          <a href={`mailto:${site.email}`} className="hover:text-brass-hi">
            {site.email}
          </a>
          <span>{site.location}</span>
          <span>{tFooter("languages")}</span>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-brass/25 pt-6 text-xs text-[#a89c80] sm:flex-row sm:items-center sm:justify-between">
          <ul className="flex flex-wrap gap-4">
            {legalNav.map((link) => (
              <li key={link.key}>
                <Link href={link.href} className="hover:text-brass-hi">
                  {tLegal(link.key)}
                </Link>
              </li>
            ))}
            <li>
              <NextLink href="/admin/login" className="hover:text-brass-hi">
                {tFooter("internalAccess")}
              </NextLink>
            </li>
          </ul>
          <div className="flex gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.short}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-brass/50 text-[11px] text-brass-hi transition hover:bg-brass/20"
              >
                {social.short}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
