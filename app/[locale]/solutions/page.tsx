import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/site/PageHero";
import { Capabilities } from "@/components/site/Capabilities";
import { FeatureShowcase } from "@/components/site/FeatureShowcase";
import { ProcessSteps } from "@/components/site/ProcessSteps";
import { StackTicker } from "@/components/site/StackTicker";
import { CtaBand } from "@/components/site/CtaBand";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "solutionsPage" });
  return { title: t("title"), description: t("lead") };
}

export default async function SolutionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("solutionsPage");

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} scene="neural">
        <Link href="/contact" className="btn-brass">
          {t("cta")}
        </Link>
      </PageHero>
      <Capabilities />
      <FeatureShowcase />
      <ProcessSteps />
      <StackTicker />
      <CtaBand />
    </>
  );
}
