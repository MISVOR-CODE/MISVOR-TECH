import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bodoni_Moda, Jost } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import "../globals.css";

// Bodoni Moda for headings (a high-contrast didone, the face of old banknotes and
// stationery), Jost for text (a geometric sans from the 1920s). Both are variable fonts.
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  style: ["normal", "italic"]
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin", "latin-ext"]
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  const languageAlternates = Object.fromEntries(routing.locales.map((l) => [l, `/${l}`]));

  return {
    title: { default: t("title"), template: "%s | MISVOR" },
    description: t("description"),
    applicationName: "MISVOR",
    manifest: "/manifest.json",
    alternates: {
      canonical: `/${locale}`,
      languages: languageAlternates
    },
    openGraph: { title: t("title"), description: t("description"), siteName: "MISVOR", type: "website" }
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Tells next-intl (and static rendering) which locale this request/render
  // is for, so server components can call getTranslations() without
  // re-deriving it from params every time.
  setRequestLocale(locale as Locale);

  return (
    <html lang={locale} className={`${bodoni.variable} ${jost.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <NextIntlClientProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <WhatsAppButton />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
