"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm({ topics }: { topics: { value: string; label: string }[] }) {
  const t = useTranslations("contactPage");
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="border border-brass-deep/60 bg-[#f6efdd] p-8">
        <p className="font-display text-2xl text-ink">{t("thanksTitle")}</p>
        <p className="mt-2 text-ink/75">{t("thanksBody")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-ink">
          {t("name")}
          <input name="name" required maxLength={120} autoComplete="name" className="field mt-1.5" />
        </label>
        <label className="block text-sm font-medium text-ink">
          {t("email")}
          <input name="email" type="email" required maxLength={200} autoComplete="email" className="field mt-1.5" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-ink">
          {t("company")}
          <input name="company" maxLength={160} autoComplete="organization" className="field mt-1.5" />
        </label>
        <label className="block text-sm font-medium text-ink">
          {t("topic")}
          <select name="topic" className="field mt-1.5" defaultValue="">
            <option value="">{t("topicPlaceholder")}</option>
            {topics.map((o) => (
              <option key={o.value} value={o.label}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium text-ink">
        {t("message")}
        <textarea name="message" required minLength={10} maxLength={5000} rows={6} placeholder={t("messagePlaceholder")} className="field mt-1.5" />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status === "sending"} className="btn-brass disabled:opacity-60">
          {status === "sending" ? t("sending") : t("send")}
        </button>
        {status === "error" && (
          <p role="alert" className="text-sm text-oxblood">
            {t("error")}
          </p>
        )}
      </div>
    </form>
  );
}
