import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), push: vi.fn(), email: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: { article: { create: m.create, update: m.update } } }));
vi.mock("@/lib/push", () => ({ sendPushToAll: m.push }));
vi.mock("@/lib/email", () => ({ sendEmailToSubscribers: m.email }));

import { POST } from "@/app/api/webhooks/n8n/route";

const SECRET = "n8n-test-secret";
const sign = (body: string, secret = SECRET) => crypto.createHmac("sha256", secret).update(body).digest("hex");

function call(rawBody: string, signature?: string | null) {
  const headers: Record<string, string> = {};
  if (signature !== null) headers["x-webhook-signature"] = signature ?? sign(rawBody);
  return POST(new NextRequest("http://x/api/webhooks/n8n", { method: "POST", body: rawBody, headers }));
}

beforeEach(() => {
  vi.stubEnv("N8N_WEBHOOK_SECRET", SECRET);
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://site.test");
  m.push.mockResolvedValue({});
  m.email.mockResolvedValue({});
});

describe("POST /api/webhooks/n8n authentication", () => {
  const body = JSON.stringify({ action: "create_article", title: "Titulo", excerpt: "e", body: "b" });

  it("rejects a request with no signature", async () => {
    expect((await call(body, null)).status).toBe(401);
  });

  it.each(["", "abc", "z".repeat(64), "z".repeat(300)])("rejects bad signature %#", async (sig) => {
    const res = await call(body, sig);
    expect(res.status).toBe(401);
    expect(m.create).not.toHaveBeenCalled();
  });

  it("rejects everything when the server has no secret configured", async () => {
    vi.stubEnv("N8N_WEBHOOK_SECRET", "");
    expect((await call(body)).status).toBe(401);
  });

  it("returns 400, not 500, for a correctly signed but non-JSON body", async () => {
    const raw = "this is not json";
    expect((await call(raw, sign(raw))).status).toBe(400);
  });
});

describe("POST /api/webhooks/n8n actions", () => {
  it("creates articles as drafts", async () => {
    m.create.mockResolvedValue({ id: "a1" });
    const res = await call(JSON.stringify({ action: "create_article", title: "Hola mundo", excerpt: "e", body: "b", locale: "EN" }));
    expect(res.status).toBe(200);
    expect(m.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: "DRAFT", locale: "EN", slug: "hola-mundo" })
    });
  });

  it("requires title, excerpt and body to create", async () => {
    expect((await call(JSON.stringify({ action: "create_article", title: "Only title" }))).status).toBe(400);
  });

  it("rejects unknown actions and locales", async () => {
    expect((await call(JSON.stringify({ action: "delete_everything" }))).status).toBe(400);
    expect((await call(JSON.stringify({ action: "create_article", locale: "DE" }))).status).toBe(400);
  });

  it("publishing sends notifications with a locale-prefixed URL", async () => {
    m.update.mockResolvedValue({ id: "a1", slug: "hola", locale: "ES", title: "t", excerpt: "e", categoryId: "c1" });
    const res = await call(JSON.stringify({ action: "publish_article", articleId: "a1" }));
    expect(res.status).toBe(200);
    expect(m.push).toHaveBeenCalledWith(expect.objectContaining({ url: "https://site.test/es/articles/hola" }), "c1");
  });
});
