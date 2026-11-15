import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/site/PageHero";
import { IndustriesGrid } from "@/components/site/IndustriesGrid";
import { Capabilities } from "@/components/site/Capabilities";
import { CtaBand } from "@/components/site/CtaBand";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "industriesPage" });
  return { title: t("title"), description: t("lead") };
}

export default async function IndustriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("industriesPage");

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} scene="globe">
        <Link href="/contact" className="btn-brass">
          {t("cta")}
        </Link>
      </PageHero>
      <IndustriesGrid withHeading={false} />
      <Capabilities />
      <CtaBand />
    </>
  );
}
