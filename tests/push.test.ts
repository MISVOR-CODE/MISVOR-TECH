import { beforeEach, describe, expect, it, vi } from "vitest";

const { setVapidDetails, sendNotification, findMany, deleteSub } = vi.hoisted(() => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn(),
  findMany: vi.fn(),
  deleteSub: vi.fn()
}));

vi.mock("web-push", () => ({ default: { setVapidDetails, sendNotification } }));
vi.mock("@/lib/prisma", () => ({
  prisma: { pushSubscription: { findMany, delete: deleteSub } }
}));

import { resetPushConfigForTests, sendPushToAll } from "@/lib/push";

const payload = { title: "Hola", body: "Nuevo artículo", url: "https://example.com/es/articles/x" };
const subs = [
  { id: "s1", endpoint: "https://push.example/1", p256dh: "k1", auth: "a1" },
  { id: "s2", endpoint: "https://push.example/2", p256dh: "k2", auth: "a2" },
  { id: "s3", endpoint: "https://push.example/3", p256dh: "k3", auth: "a3" }
];

beforeEach(() => {
  resetPushConfigForTests();
  deleteSub.mockResolvedValue({});
});

describe("sendPushToAll", () => {
  // Regression: web-push threw "No key set vapidDetails.publicKey" at import
  // time, which crashed `next build` whenever the keys weren't configured.
  it("importing the module never touches VAPID configuration", () => {
    expect(setVapidDetails).not.toHaveBeenCalled();
  });

  it("skips cleanly (no DB query, no throw) when VAPID keys are missing", async () => {
    vi.stubEnv("VAPID_PUBLIC_KEY", "");
    vi.stubEnv("VAPID_PRIVATE_KEY", "");
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(await sendPushToAll(payload)).toEqual({ sent: 0, total: 0, skipped: true });
    expect(findMany).not.toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("configures VAPID once and sends to every subscription", async () => {
    vi.stubEnv("VAPID_PUBLIC_KEY", "pub");
    vi.stubEnv("VAPID_PRIVATE_KEY", "priv");
    vi.stubEnv("VAPID_SUBJECT", "mailto:ops@example.com");
    findMany.mockResolvedValue(subs);
    sendNotification.mockResolvedValue({});

    const first = await sendPushToAll(payload);
    await sendPushToAll(payload);

    expect(first).toEqual({ sent: 3, total: 3 });
    expect(setVapidDetails).toHaveBeenCalledTimes(1);
    expect(setVapidDetails).toHaveBeenCalledWith("mailto:ops@example.com", "pub", "priv");
    expect(sendNotification).toHaveBeenCalledWith(
      { endpoint: subs[0].endpoint, keys: { p256dh: "k1", auth: "a1" } },
      JSON.stringify(payload)
    );
  });

  it("removes expired subscriptions (404/410) but keeps ones that failed for other reasons", async () => {
    vi.stubEnv("VAPID_PUBLIC_KEY", "pub");
    vi.stubEnv("VAPID_PRIVATE_KEY", "priv");
    findMany.mockResolvedValue(subs);
    sendNotification
      .mockRejectedValueOnce({ statusCode: 410 })
      .mockRejectedValueOnce({ statusCode: 404 })
      .mockRejectedValueOnce({ statusCode: 500 });

    const result = await sendPushToAll(payload);

    expect(result).toEqual({ sent: 0, total: 3 });
    expect(deleteSub.mock.calls.map((c) => c[0].where.id).sort()).toEqual(["s1", "s2"]);
  });

  it("scopes recipients by category when one is given", async () => {
    vi.stubEnv("VAPID_PUBLIC_KEY", "pub");
    vi.stubEnv("VAPID_PRIVATE_KEY", "priv");
    findMany.mockResolvedValue([]);

    await sendPushToAll(payload, "cat-9");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user: { preferences: { webPushEnabled: true, categoryIds: { has: "cat-9" } } } }
      })
    );
  });
});
