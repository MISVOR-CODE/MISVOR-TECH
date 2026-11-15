"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function NewsletterSection() {
  const t = useTranslations("newsletter");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const valueProps = [t("value1"), t("value2"), t("value3")];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="border-b border-brass/25 py-14 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-medium text-[#f6edd6] sm:text-4xl">{t("heading")}</h2>
        <div className="rule-double mx-auto mt-5 w-24" />

        <ul className="mt-8 grid grid-cols-1 gap-3 text-sm text-[#d9ceb4] sm:grid-cols-3">
          {valueProps.map((vp) => (
            <li key={vp} className="border border-brass/30 px-4 py-4">
              {vp}
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            className="flex-1 border border-brass/50 bg-vellum px-4 py-3 text-sm text-ink placeholder:text-ink/45"
          />
          <button type="submit" className="btn-brass">
            {t("subscribe")}
          </button>
        </form>
        {submitted && <p className="mt-3 text-sm text-brass-hi">{t("thanks")}</p>}

        <p className="mt-5 text-xs text-[#a89c80]">
          {t("disclaimer")}{" "}
          <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-brass-hi">
            {t("privacyLink")}
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
