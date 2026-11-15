import webpush from "web-push";
import { prisma } from "@/lib/prisma";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

// VAPID is configured lazily, on first send. Doing it at import time made
// `next build` (and every cold start) crash whenever the keys weren't set,
// e.g. a fresh Vercel project or a Docker image build.
let vapidConfigured: boolean | null = null;

function ensureVapidConfigured(): boolean {
  if (vapidConfigured !== null) return vapidConfigured;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    vapidConfigured = false;
    return false;
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    publicKey,
    privateKey
  );
  vapidConfigured = true;
  return true;
}

/** Test hook: forget the cached VAPID state so env changes are picked up. */
export function resetPushConfigForTests() {
  vapidConfigured = null;
}

export async function sendPushToAll(payload: PushPayload, categoryId?: string | null) {
  if (!ensureVapidConfigured()) {
    console.warn("[push] VAPID keys are not configured; skipping web push.");
    return { sent: 0, total: 0, skipped: true as const };
  }

  const subs = await prisma.pushSubscription.findMany({
    where: categoryId
      ? {
          user: {
            preferences: {
              webPushEnabled: true,
              categoryIds: { has: categoryId }
            }
          }
        }
      : { user: { preferences: { webPushEnabled: true } } },
    select: { id: true, endpoint: true, p256dh: true, auth: true }
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        },
        JSON.stringify(payload)
      )
    )
  );

  // Clean up subscriptions that are no longer valid (410 Gone / 404).
  await Promise.all(
    results.map(async (result, i) => {
      if (result.status === "rejected") {
        const statusCode = (result.reason as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: subs[i].id } }).catch(() => {});
        }
      }
    })
  );

  return { sent: results.filter((r) => r.status === "fulfilled").length, total: subs.length };
}
