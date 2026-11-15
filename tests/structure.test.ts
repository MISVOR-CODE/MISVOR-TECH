import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
}

// A route's URL ignores (route-groups), so two files can silently claim the same URL.
const urlOf = (file: string) =>
  "/" + relative("app", file).split(sep).slice(0, -1).filter((s) => !/^\(.*\)$/.test(s)).join("/");

const files = walk("app");
const routeFiles = files.filter((f) => /[\\/](page|route)\.(tsx|ts)$/.test(f));

describe("app router structure", () => {
  // Regression: app/admin/page.tsx duplicated app/admin/(protected)/page.tsx.
  // The copy outside the group skipped the role check in the protected layout.
  it("no two pages or route handlers resolve to the same URL", () => {
    const seen = new Map<string, string[]>();
    for (const file of routeFiles) {
      const key = `${/page\./.test(file) ? "page" : "route"}:${urlOf(file)}`;
      seen.set(key, [...(seen.get(key) ?? []), file]);
    }
    const duplicates = [...seen.entries()].filter(([, list]) => list.length > 1);
    expect(duplicates).toEqual([]);
  });

  it("every admin page lives under the role-checked (protected) group, except login", () => {
    const adminPages = files.filter((f) => /^app[\\/]admin[\\/].*page\.tsx$/.test(f));
    const unprotected = adminPages.filter((f) => !f.includes("(protected)") && !f.includes(join("admin", "login")));
    expect(unprotected).toEqual([]);
  });

  it("uses two independent root layouts, with no app/layout.tsx above them", () => {
    expect(existsSync("app/layout.tsx")).toBe(false);
    for (const layout of ["app/[locale]/layout.tsx", "app/admin/layout.tsx"]) {
      expect(readFileSync(layout, "utf8"), layout).toMatch(/<html[\s>]/);
    }
  });

  it("has no non-localized public pages that would shadow or bypass i18n routing", () => {
    const publicPages = routeFiles
      .filter((f) => /page\.tsx$/.test(f))
      .map(urlOf)
      .filter((u) => !u.startsWith("/[locale]") && !u.startsWith("/admin"));
    expect(publicPages).toEqual([]);
  });
});
