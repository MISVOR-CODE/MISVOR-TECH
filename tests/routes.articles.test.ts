import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  del: vi.fn(),
  auth: vi.fn(),
  push: vi.fn(),
  email: vi.fn(),
  dispatch: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { article: { findMany: m.findMany, findUnique: m.findUnique, create: m.create, update: m.update, delete: m.del } }
}));
vi.mock("@/lib/auth", () => ({ auth: m.auth }));
vi.mock("@/lib/push", () => ({ sendPushToAll: m.push }));
vi.mock("@/lib/email", () => ({ sendEmailToSubscribers: m.email }));
vi.mock("@/lib/webhooks", () => ({ dispatchWebhookEvent: m.dispatch }));

import { GET as listArticles, POST as createArticle } from "@/app/api/articles/route";
import { GET as getArticle, PUT as updateArticle, DELETE as deleteArticle } from "@/app/api/articles/[id]/route";

const asUser = (role: string) => m.auth.mockResolvedValue({ user: { id: "u1", role } });
const json = (url: string, method: string, body: unknown) =>
  new NextRequest(url, { method, body: JSON.stringify(body), headers: { "content-type": "application/json" } });
const ctx = (id = "a1") => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  m.auth.mockResolvedValue(null);
  m.push.mockResolvedValue({ sent: 0, total: 0 });
  m.email.mockResolvedValue({ sent: 0, total: 0 });
  m.dispatch.mockResolvedValue({ attempted: 0, succeeded: 0 });
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://site.test");
});

describe("GET /api/articles", () => {
  it("returns 400 for an unknown locale instead of crashing", async () => {
    const res = await listArticles(new NextRequest("http://x/api/articles?locale=xx"));
    expect(res.status).toBe(400);
    expect(m.findMany).not.toHaveBeenCalled();
  });

  it.each(["abc", "-5", "0", ""])("treats page=%j as page 1", async (page) => {
    m.findMany.mockResolvedValue([]);
    const res = await listArticles(new NextRequest(`http://x/api/articles?page=${page}`));
    expect(res.status).toBe(200);
    expect(m.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 12 }));
  });

  it("filters by locale (case-insensitively), paginates, and is CDN cacheable", async () => {
    m.findMany.mockResolvedValue([]);
    const res = await listArticles(new NextRequest("http://x/api/articles?locale=en&page=3"));
    expect(m.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 24, where: expect.objectContaining({ status: "PUBLISHED", locale: "EN" }) })
    );
    expect(res.headers.get("cache-control")).toContain("s-maxage=60");
  });
});

describe("GET /api/articles/[id] (draft visibility)", () => {
  const article = (status: string) => ({ id: "a1", status, title: "T" });

  it("serves published articles to anonymous visitors", async () => {
    m.findUnique.mockResolvedValue(article("PUBLISHED"));
    expect((await getArticle(new NextRequest("http://x"), ctx())).status).toBe(200);
  });

  it.each(["DRAFT", "ARCHIVED"])("hides %s articles from anonymous visitors with a plain 404", async (status) => {
    m.findUnique.mockResolvedValue(article(status));
    expect((await getArticle(new NextRequest("http://x"), ctx())).status).toBe(404);
  });

  it("hides drafts from signed-in readers too", async () => {
    asUser("READER");
    m.findUnique.mockResolvedValue(article("DRAFT"));
    expect((await getArticle(new NextRequest("http://x"), ctx())).status).toBe(404);
  });

  it.each(["EDITOR", "ADMIN"])("shows drafts to %s", async (role) => {
    asUser(role);
    m.findUnique.mockResolvedValue(article("DRAFT"));
    expect((await getArticle(new NextRequest("http://x"), ctx())).status).toBe(200);
  });

  it("returns 404 for a missing article", async () => {
    m.findUnique.mockResolvedValue(null);
    expect((await getArticle(new NextRequest("http://x"), ctx())).status).toBe(404);
  });
});

describe("write endpoints require the right role", () => {
  const body = { title: "Hola mundo", excerpt: "x", body: "<p>x</p>" };

  it("POST rejects anonymous and reader sessions", async () => {
    expect((await createArticle(json("http://x/api/articles", "POST", body))).status).toBe(401);
    asUser("READER");
    expect((await createArticle(json("http://x/api/articles", "POST", body))).status).toBe(401);
    expect(m.create).not.toHaveBeenCalled();
  });

  it("PUT rejects anonymous callers", async () => {
    expect((await updateArticle(json("http://x", "PUT", { title: "Nuevo titulo" }), ctx())).status).toBe(401);
  });

  it("DELETE is admin only", async () => {
    asUser("EDITOR");
    expect((await deleteArticle(new NextRequest("http://x", { method: "DELETE" }), ctx())).status).toBe(401);
    asUser("ADMIN");
    m.del.mockResolvedValue({});
    expect((await deleteArticle(new NextRequest("http://x", { method: "DELETE" }), ctx())).status).toBe(200);
  });

  it("POST validates the payload", async () => {
    asUser("EDITOR");
    const res = await createArticle(json("http://x/api/articles", "POST", { title: "x" }));
    expect(res.status).toBe(400);
  });

  it("publishing notifies with a locale-prefixed article URL", async () => {
    asUser("EDITOR");
    m.create.mockResolvedValue({
      id: "a1", title: "Hola mundo", slug: "hola-mundo", excerpt: "x", locale: "FR", status: "PUBLISHED", categoryId: null
    });

    const res = await createArticle(json("http://x/api/articles", "POST", { ...body, status: "PUBLISHED", locale: "FR" }));

    expect(res.status).toBe(201);
    const expectedUrl = "https://site.test/fr/articles/hola-mundo";
    expect(m.push).toHaveBeenCalledWith(expect.objectContaining({ url: expectedUrl }), null);
    expect(m.email).toHaveBeenCalledWith(expect.objectContaining({ url: expectedUrl }), null);
  });

  it("saving a draft sends no notifications", async () => {
    asUser("EDITOR");
    m.create.mockResolvedValue({ id: "a1", slug: "s", status: "DRAFT", locale: "ES", title: "t", excerpt: "e" });
    await createArticle(json("http://x/api/articles", "POST", body));
    expect(m.push).not.toHaveBeenCalled();
    expect(m.email).not.toHaveBeenCalled();
  });
});
