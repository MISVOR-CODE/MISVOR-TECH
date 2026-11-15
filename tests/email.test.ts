import { beforeEach, describe, expect, it, vi } from "vitest";

const { batchSend, findMany } = vi.hoisted(() => ({ batchSend: vi.fn(), findMany: vi.fn() }));

vi.mock("resend", () => ({
  // Like the real SDK, the constructor throws without an API key.
  Resend: class {
    batch = { send: batchSend };
    constructor(key?: string) {
      if (!key) throw new Error("Missing API key.");
    }
  }
}));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findMany } } }));

const payload = {
  subject: "Nuevo artículo",
  heading: "Modelo 303",
  summary: "Fechas clave",
  url: "https://example.com/es/articles/modelo-303"
};

const users = (n: number) => Array.from({ length: n }, (_, i) => ({ email: `user${i}@example.com` }));

async function loadEmail() {
  vi.resetModules();
  return import("@/lib/email");
}

beforeEach(() => {
  batchSend.mockResolvedValue({ data: {}, error: null });
});

describe("sendEmailToSubscribers", () => {
  it("does not throw at import time without RESEND_API_KEY, and skips sending", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    findMany.mockResolvedValue(users(2));

    const { sendEmailToSubscribers } = await loadEmail(); // used to throw here
    const result = await sendEmailToSubscribers(payload);

    expect(result).toEqual({ sent: 0, total: 2, skipped: true });
    expect(batchSend).not.toHaveBeenCalled();
  });

  it("returns early when nobody is subscribed", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    findMany.mockResolvedValue([]);
    const { sendEmailToSubscribers } = await loadEmail();

    expect(await sendEmailToSubscribers(payload)).toEqual({ sent: 0, total: 0 });
    expect(batchSend).not.toHaveBeenCalled();
  });

  // Regression: everyone used to be put in a single `to` list, exposing every
  // subscriber's address to every other subscriber.
  it("sends one message per recipient so addresses are never shared", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    findMany.mockResolvedValue(users(3));
    const { sendEmailToSubscribers } = await loadEmail();

    await sendEmailToSubscribers(payload);

    expect(batchSend).toHaveBeenCalledTimes(1);
    const messages = batchSend.mock.calls[0][0] as Array<{ to: string[] }>;
    expect(messages).toHaveLength(3);
    for (const [i, message] of messages.entries()) {
      expect(message.to).toEqual([`user${i}@example.com`]);
      const serialized = JSON.stringify(message);
      for (const other of users(3).filter((_, j) => j !== i)) {
        expect(serialized).not.toContain(other.email);
      }
    }
  });

  it("splits large audiences into batches of at most 100", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    findMany.mockResolvedValue(users(250));
    const { sendEmailToSubscribers } = await loadEmail();

    const result = await sendEmailToSubscribers(payload);

    expect(batchSend.mock.calls.map((c) => c[0].length)).toEqual([100, 100, 50]);
    expect(result).toEqual({ sent: 250, total: 250 });
  });

  it("only counts batches that were accepted", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.spyOn(console, "error").mockImplementation(() => {});
    findMany.mockResolvedValue(users(250));
    batchSend
      .mockResolvedValueOnce({ data: {}, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "rate limited" } })
      .mockRejectedValueOnce(new Error("network"));
    const { sendEmailToSubscribers } = await loadEmail();

    expect(await sendEmailToSubscribers(payload)).toEqual({ sent: 100, total: 250 });
  });

  it("filters by category preference when a category is given", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    findMany.mockResolvedValue([]);
    const { sendEmailToSubscribers } = await loadEmail();

    await sendEmailToSubscribers(payload, "cat-1");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { preferences: { emailEnabled: true, categoryIds: { has: "cat-1" } } }
      })
    );
  });
});

describe("buildEmailHtml", () => {
  it("escapes HTML in every interpolated field", async () => {
    const { buildEmailHtml, escapeHtml } = await loadEmail();
    const html = buildEmailHtml({
      heading: `<script>alert(1)</script>`,
      summary: `Tom & "Jerry" <img src=x onerror=alert(1)>`,
      url: `https://example.com/?a=1&b="><script>x</script>`
    });

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("a=1&amp;b=&quot;&gt;");
    expect(escapeHtml(`'`)).toBe("&#39;");
  });
});
