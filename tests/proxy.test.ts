import { NextRequest } from "next/server";
import { encode } from "next-auth/jwt";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Uses the real Auth.js session handling and real signed JWTs. Only the
// database is out of the picture, which is the point of the slim auth config:
// the proxy must be able to authorize /admin without it.
const SECRET = "proxy-test-secret";
// Auth.js picks the cookie name (and uses it as the JWT salt) from the protocol:
// "authjs.session-token" over http, "__Secure-authjs.session-token" over https.
const cookieName = (proto: "http" | "https") => (proto === "https" ? "__Secure-authjs.session-token" : "authjs.session-token");

async function sessionCookie(claims: Record<string, unknown>, secret = SECRET, proto: "http" | "https" = "http") {
  const name = cookieName(proto);
  const token = await encode({ token: { sub: "u1", email: "a@b.test", ...claims }, secret, salt: name });
  return `${name}=${token}`;
}

// The real Next server always sets x-forwarded-proto, which Auth.js reads.
async function run(path: string, cookie?: string, proto: "http" | "https" = "http") {
  const { default: proxy } = await import("@/proxy");
  const headers: Record<string, string> = { "x-forwarded-proto": proto };
  if (cookie) headers.cookie = cookie;
  const request = new NextRequest(`${proto}://localhost:3000${path}`, { headers });
  return (proxy as (r: NextRequest, e: unknown) => Promise<Response>)(request, {});
}

const passedThrough = (res: Response) => res.headers.get("x-middleware-next") === "1";

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", SECRET);
});

describe("proxy: admin gate", () => {
  it.each(["/admin", "/admin/articles", "/admin/articles/new"])("redirects anonymous %s to the login page", async (path) => {
    const res = await run(path);
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/admin/login");
    expect(location.searchParams.get("callbackUrl")).toBe(path);
  });

  it("leaves the login page reachable", async () => {
    expect(passedThrough(await run("/admin/login"))).toBe(true);
  });

  it.each(["http", "https"] as const)("lets a request with a valid signed session through over %s", async (proto) => {
    const cookie = await sessionCookie({ role: "EDITOR" }, SECRET, proto);
    expect(passedThrough(await run("/admin", cookie, proto))).toBe(true);
  });

  it("does not accept the wrong cookie name for the protocol", async () => {
    const httpCookie = await sessionCookie({ role: "EDITOR" }, SECRET, "http");
    expect((await run("/admin", httpCookie, "https")).status).toBe(307);
  });

  it("rejects a session signed with the wrong secret", async () => {
    const forged = await sessionCookie({ role: "ADMIN" }, "attacker-secret");
    expect((await run("/admin", forged)).status).toBe(307);
  });

  it("rejects a garbage session cookie", async () => {
    expect((await run("/admin", `${cookieName("http")}=not-a-jwt`)).status).toBe(307);
  });
});

describe("proxy: locale routing", () => {
  it("sends the bare root to the default locale", async () => {
    const res = await run("/");
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/en");
  });

  it("serves prefixed locale paths without redirecting", async () => {
    for (const path of ["/es", "/en/search", "/fr/articles/anything"]) {
      const res = await run(path);
      expect(res.status, path).toBe(200);
    }
  });

  it("never applies the locale redirect to /admin", async () => {
    const res = await run("/admin/login");
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("proxy matcher", () => {
  it("skips API routes, Next internals and files with an extension", async () => {
    const { config } = await import("@/proxy");
    const pattern = new RegExp(`^${config.matcher[0]}$`);
    for (const skipped of ["/api/search", "/api/auth/session", "/_next/static/a.js", "/favicon.ico", "/videos/v1.mp4", "/manifest.json"]) {
      expect(pattern.test(skipped), skipped).toBe(false);
    }
    for (const handled of ["/", "/es", "/admin", "/admin/login", "/en/articles/slug"]) {
      expect(pattern.test(handled), handled).toBe(true);
    }
  });
});

describe("proxy dependencies", () => {
  it("does not import the full auth module (Prisma, bcrypt, providers)", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("proxy.ts", "utf8");
    expect(source).not.toMatch(/from\s+["']@\/lib\/auth["']/);
    expect(source).not.toMatch(/@\/lib\/prisma|bcryptjs/);
  });
});
