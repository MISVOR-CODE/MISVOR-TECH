import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import { industries, solutions } from "@/lib/content";
import { primaryNav, footerNav, legalNav } from "@/lib/navigation";

const locales = { en, es, fr } as const;
type Dict = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

describe("solution and industry content", () => {
  for (const [loc, msgs] of Object.entries(locales) as [string, Dict][]) {
    it(`${loc}: every solution has text and the expected list lengths`, () => {
      for (const s of solutions) {
        const p = msgs.solutionPages[s.key];
        expect(p, s.key).toBeTruthy();
        for (const k of ["title", "short", "lead", "overview", "outcome"]) expect(typeof p[k], `${s.key}.${k}`).toBe("string");
        expect(p.build).toHaveLength(4);
        expect(p.steps).toHaveLength(3);
      }
    });
    it(`${loc}: every industry has text and four automations`, () => {
      for (const i of industries) {
        const p = msgs.industryPages[i.key];
        expect(p, i.key).toBeTruthy();
        for (const k of ["title", "short", "lead", "overview", "example"]) expect(typeof p[k], `${i.key}.${k}`).toBe("string");
        expect(p.automate).toHaveLength(4);
      }
    });
  }

  it("every solution and industry references things that exist", () => {
    const sKeys = new Set(solutions.map((s) => s.key));
    const iKeys = new Set(industries.map((i) => i.key));
    for (const s of solutions) for (const k of s.industries) expect(iKeys.has(k), `${s.key} -> ${k}`).toBe(true);
    for (const i of industries) for (const k of i.solutions) expect(sKeys.has(k), `${i.key} -> ${k}`).toBe(true);
  });

  it("slugs are unique", () => {
    expect(new Set(solutions.map((s) => s.slug)).size).toBe(solutions.length);
    expect(new Set(industries.map((i) => i.slug)).size).toBe(industries.length);
  });
});

describe("navigation points at real pages", () => {
  const hrefs = [...primaryNav.flatMap((n) => [n.href, ...(n.children?.map((c) => c.href) ?? [])]), ...footerNav.flatMap((g) => g.links.map((l) => l.href)), ...legalNav.map((l) => l.href)];
  const dynamic = (href: string) => /^\/(solutions|industries)\/[^/]+$/.test(href) || /^\/legal\/[^/]+$/.test(href);
  it("every static href has a page.tsx", () => {
    for (const href of new Set(hrefs)) {
      if (dynamic(href)) continue;
      const file = join(process.cwd(), "app", "[locale]", href, "page.tsx");
      expect(existsSync(file), href).toBe(true);
    }
  });
  it("the founder has a page of its own", () => {
    expect(hrefs).toContain("/founder");
  });
});
