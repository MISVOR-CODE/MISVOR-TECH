import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type Tree = { [key: string]: string | Tree };
const LOCALES = ["en", "es", "fr"] as const;

const load = (locale: string): Tree => JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? { ...acc, [path]: value } : { ...acc, ...flatten(value, path) };
  }, {});
}

const messages = Object.fromEntries(LOCALES.map((l) => [l, flatten(load(l))]));
// ICU argument names only: `{query}` or `{count, plural, ...}`. Literal words inside
// plural branches (`{No results}`) are text, not arguments.
const placeholders = (text: string) => [...new Set([...text.matchAll(/\{(\w+)\s*[,}]/g)].map((m) => m[1]))].sort();

describe("translations", () => {
  const allKeys = [...new Set(LOCALES.flatMap((l) => Object.keys(messages[l])))].sort();

  it.each(LOCALES)("%s has every key that exists in any other locale", (locale) => {
    expect(allKeys.filter((k) => !(k in messages[locale]))).toEqual([]);
  });

  it.each(LOCALES)("%s has no empty strings", (locale) => {
    expect(Object.entries(messages[locale]).filter(([, v]) => v.trim() === "").map(([k]) => k)).toEqual([]);
  });

  it("uses the same {placeholders} in every locale", () => {
    const mismatched = allKeys.filter((key) => {
      const sets = LOCALES.map((l) => JSON.stringify(placeholders(messages[l][key] ?? "")));
      return new Set(sets).size > 1;
    });
    expect(mismatched).toEqual([]);
  });
});
