import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dirs = readdirSync("prisma/migrations", { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

describe("prisma migrations", () => {
  it("every migration folder has a migration.sql and a sortable timestamp name", () => {
    expect(dirs.length).toBeGreaterThan(0);
    for (const dir of dirs) {
      expect(dir).toMatch(/^\d{14}_[a-z0-9_]+$/);
      expect(existsSync(`prisma/migrations/${dir}/migration.sql`), dir).toBe(true);
    }
  });

  it("targets postgresql", () => {
    expect(readFileSync("prisma/migrations/migration_lock.toml", "utf8")).toContain('provider = "postgresql"');
  });

  it("installs full-text search as a real migration, after the tables it depends on", () => {
    const search = dirs.find((d) => d.endsWith("enable_fulltext_search"));
    expect(search).toBeDefined();
    const sql = readFileSync(`prisma/migrations/${search}/migration.sql`, "utf8");
    expect(sql).toContain("CREATE OR REPLACE FUNCTION article_search_vector_update");
    expect(sql).toContain("CREATE TRIGGER article_search_vector_trigger");
    expect(sql).toContain('USING GIN ("searchVector")');
    expect(dirs.indexOf(search!)).toBe(dirs.length - 1);
  });

  it("stays in sync with the manual script in prisma/sql/enable-search.sql", () => {
    const body = (sql: string) => sql.slice(sql.indexOf("CREATE OR REPLACE FUNCTION")).replace(/\s+/g, " ").trim();
    const search = dirs.find((d) => d.endsWith("enable_fulltext_search"))!;
    expect(body(readFileSync(`prisma/migrations/${search}/migration.sql`, "utf8"))).toBe(
      body(readFileSync("prisma/sql/enable-search.sql", "utf8"))
    );
  });

  it("every migration statement that could be re-run is guarded (search migration is idempotent)", () => {
    const sql = readFileSync(`prisma/migrations/${dirs.at(-1)}/migration.sql`, "utf8");
    expect(sql).toContain("DROP TRIGGER IF EXISTS");
    expect(sql).toContain("CREATE INDEX IF NOT EXISTS");
  });
});

describe("prisma schema", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");

  it("declares the GIN index so `migrate dev` does not try to drop it", () => {
    expect(schema).toMatch(/@@index\(\[searchVector\], type: Gin\)/);
  });

  it("generates the engine Vercel runs on", () => {
    expect(schema).toContain("rhel-openssl-3.0.x");
    expect(schema).toContain('"native"');
  });

  it("keeps Locale enum values in sync with the frontend routing", () => {
    const routing = readFileSync("i18n/routing.ts", "utf8");
    const enumBody = schema.match(/enum Locale \{([^}]*)\}/)![1];
    const dbLocales = enumBody.split(/\s+/).filter(Boolean).map((l) => l.toLowerCase()).sort();
    const appLocales = [...new Set([...routing.matchAll(/"(\w\w)"/g)].map((m) => m[1]))].filter((l) => dbLocales.includes(l)).sort();
    expect(appLocales).toEqual(dbLocales);
  });
});
