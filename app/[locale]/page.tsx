import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { HomeHero } from "@/components/site/HomeHero";
import { Capabilities } from "@/components/site/Capabilities";
import { FeatureShowcase } from "@/components/site/FeatureShowcase";
import { MisvorAi } from "@/components/site/MisvorAi";
import { IndustriesGrid } from "@/components/site/IndustriesGrid";
import { ProcessSteps } from "@/components/site/ProcessSteps";
import { StackTicker } from "@/components/site/StackTicker";
import { CtaBand } from "@/components/site/CtaBand";
import { MobileStickyCTA } from "@/components/site/MobileStickyCTA";

export const revalidate = 60;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <div className="pb-20 lg:pb-0">
      <HomeHero />
      <Capabilities />
      <FeatureShowcase />
      <IndustriesGrid />
      <MisvorAi />
      <StackTicker />
      <ProcessSteps />
      <CtaBand />
      <MobileStickyCTA />
    </div>
  );
}
