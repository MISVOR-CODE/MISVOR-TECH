import { describe, expect, it } from "vitest";
import { migrationDatabaseUrl, shouldMigrate } from "../scripts/vercel-build.mjs";

describe("vercel-build migration policy", () => {
  it("migrates on production deployments only by default", () => {
    expect(shouldMigrate({ VERCEL_ENV: "production" })).toBe(true);
    expect(shouldMigrate({ VERCEL_ENV: "preview" })).toBe(false);
    expect(shouldMigrate({ VERCEL_ENV: "development" })).toBe(false);
    expect(shouldMigrate({})).toBe(false);
  });

  it("honours an explicit override in both directions", () => {
    expect(shouldMigrate({ VERCEL_ENV: "preview", RUN_MIGRATIONS: "1" })).toBe(true);
    expect(shouldMigrate({ VERCEL_ENV: "production", RUN_MIGRATIONS: "0" })).toBe(false);
  });

  it("prefers the direct (non pooled) URL for migrations", () => {
    expect(migrationDatabaseUrl({ DATABASE_URL: "pooled", DIRECT_URL: "direct" })).toBe("direct");
    expect(migrationDatabaseUrl({ DATABASE_URL: "pooled" })).toBe("pooled");
    expect(migrationDatabaseUrl({ DATABASE_URL: "pooled", DIRECT_URL: "" })).toBe("pooled");
  });
});
