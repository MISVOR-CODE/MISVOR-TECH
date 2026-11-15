import crypto from "node:crypto";
import { describe, expect, it, vi } from "vitest";

const { findMany, createDelivery } = vi.hoisted(() => ({
  findMany: vi.fn(),
  createDelivery: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    webhookEndpoint: { findMany },
    webhookDelivery: { create: createDelivery }
  }
}));

import { dispatchWebhookEvent, verifyIncomingSignature } from "@/lib/webhooks";

const sign = (secret: string, body: string) =>
  crypto.createHmac("sha256", secret).update(body).digest("hex");

describe("verifyIncomingSignature", () => {
  const body = JSON.stringify({ action: "publish_article", articleId: "a1" });

  it("accepts a correct signature", () => {
    expect(verifyIncomingSignature("s3cret", body, sign("s3cret", body))).toBe(true);
  });

  it("rejects a signature made with another secret", () => {
    expect(verifyIncomingSignature("s3cret", body, sign("other", body))).toBe(false);
  });

  it("rejects a tampered body", () => {
    expect(verifyIncomingSignature("s3cret", body + " ", sign("s3cret", body))).toBe(false);
  });

  // Regression: crypto.timingSafeEqual throws on unequal lengths, which used to
  // turn a malformed header into an HTTP 500 instead of a clean rejection.
  it.each(["", "abc", "x".repeat(200)])("rejects a wrong-length signature without throwing (%#)", (bad) => {
    expect(() => verifyIncomingSignature("s3cret", body, bad)).not.toThrow();
    expect(verifyIncomingSignature("s3cret", body, bad)).toBe(false);
  });
});

describe("dispatchWebhookEvent", () => {
  it("signs the exact body it sends and records each delivery", async () => {
    findMany.mockResolvedValue([
      { id: "e1", url: "https://n8n.example/hook", secret: "shh", event: "article.published", active: true }
    ]);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const result = await dispatchWebhookEvent({ event: "article.published", data: { id: "a1" } });

    expect(result).toEqual({ attempted: 1, succeeded: 1 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://n8n.example/hook");
    expect(init.headers["X-Webhook-Signature"]).toBe(sign("shh", init.body));
    expect(init.headers["X-Webhook-Event"]).toBe("article.published");
    expect(createDelivery).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ endpointId: "e1", responseCode: 200, success: true }) })
    );
  });

  it("does not let one failing endpoint break the others", async () => {
    findMany.mockResolvedValue([
      { id: "bad", url: "https://down.example", secret: "a" },
      { id: "good", url: "https://up.example", secret: "b" }
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("down")) throw new Error("ECONNREFUSED");
        return { ok: true, status: 200 };
      })
    );

    const result = await dispatchWebhookEvent({ event: "article.updated", data: {} });
    expect(result).toEqual({ attempted: 2, succeeded: 1 });
  });
});
