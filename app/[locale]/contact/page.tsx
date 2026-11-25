import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHero } from "@/components/site/PageHero";
import { ContactForm } from "@/components/site/ContactForm";
import { ServiceIcon } from "@/components/site/icons";
import { solutions } from "@/lib/content";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contactPage" });
  return { title: t("title"), description: t("lead") };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("contactPage");
  const tSol = await getTranslations("solutionPages");

  const topics = [...solutions.map((s) => ({ value: s.key, label: tSol(`${s.key}.title`) })), { value: "other", label: t("topicOther") }];
  const wa = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(t("whatsappMessage"))}`;

  const cards = [
    { icon: "mail", label: t("emailLabel"), value: site.email, href: `mailto:${site.email}` },
    { icon: "whatsapp", label: "WhatsApp", value: t("whatsappValue"), href: wa },
    { icon: "pin", label: t("locationLabel"), value: site.location },
    { icon: "globe", label: t("languagesLabel"), value: t("languagesValue") }
  ] as const;

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} scene="stack" compact />
      <section className="surface-vellum px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h2 className="text-3xl font-medium text-ink sm:text-4xl">{t("formTitle")}</h2>
            <div className="rule-double mt-5 w-24" />
            <p className="mb-8 mt-5 max-w-xl text-base leading-relaxed text-ink/75">{t("formIntro")}</p>
            <ContactForm topics={topics} />
          </div>
          <aside className="space-y-4 lg:col-span-2">
            {cards.map((c) => {
              const inner = (
                <>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brass/60 bg-night/70 text-brass-hi">
                    <ServiceIcon name={c.icon} className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-medium uppercase tracking-[0.18em] text-[#cdbf9f]">{c.label}</span>
                    <span className="mt-0.5 block font-display text-lg text-[#f6edd6]">{c.value}</span>
                  </span>
                </>
              );
              const cls = "plaque beam flex items-center gap-4 p-5";
              return "href" in c ? (
                <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={`${cls} transition hover:-translate-y-0.5`}>
                  {inner}
                </a>
              ) : (
                <div key={c.label} className={cls}>
                  {inner}
                </div>
              );
            })}
            <p className="pt-2 text-sm leading-relaxed text-ink/65">{t("reply")}</p>
          </aside>
        </div>
      </section>
    </>
  );
}
