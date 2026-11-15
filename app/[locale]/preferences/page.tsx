"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PreferencesPage() {
  const t = useTranslations("preferences");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    navigator.serviceWorker?.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      setPushEnabled(!!sub);
    });
  }, []);

  async function enablePush() {
    setStatus(t("requesting"));
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus(t("denied"));
      return;
    }

    const reg = await navigator.serviceWorker.register("/sw.js");
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
      )
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub)
    });

    setPushEnabled(true);
    setStatus(t("enabled"));
  }

  async function disablePush() {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint })
      });
      await sub.unsubscribe();
    }
    setPushEnabled(false);
    setStatus(t("disabled"));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">{t("heading")}</h1>
      <p className="mt-1 text-ink/60">{t("subheading")}</p>

      <div className="mt-8 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-ink">{t("pushTitle")}</p>
            <p className="text-sm text-ink/60">{t("pushDescription")}</p>
          </div>
          <button
            onClick={pushEnabled ? disablePush : enablePush}
            className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            {pushEnabled ? t("disable") : t("enable")}
          </button>
        </div>
        {status && <p className="mt-3 text-sm text-ink/50">{status}</p>}
      </div>

      <p className="mt-4 text-sm text-ink/50">{t("emailNote")}</p>
    </div>
  );
}
