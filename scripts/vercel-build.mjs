// Build entry point for Vercel (wired up through the "vercel-build" npm script).
//
// Order matters: the client must be generated first, migrations must run before
// `next build` (the home page reads the database while prerendering), and only
// production deployments should touch the production database.
import { spawnSync } from "node:child_process";

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
    shell: process.platform === "win32"
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

/** Decide whether this build should apply database migrations. */
export function shouldMigrate(env) {
  // Explicit override wins: RUN_MIGRATIONS=1 forces, RUN_MIGRATIONS=0 skips.
  if (env.RUN_MIGRATIONS === "1") return true;
  if (env.RUN_MIGRATIONS === "0") return false;
  // Default: production deployments only, so preview builds never migrate a
  // database they may share with production.
  return env.VERCEL_ENV === "production";
}

/** Poolers (pgbouncer, Neon pooled URLs) can't hold Prisma's migration lock, so prefer a direct URL. */
export function migrationDatabaseUrl(env) {
  return env.DIRECT_URL || env.DATABASE_URL;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  run("npx", ["prisma", "generate"]);

  if (shouldMigrate(process.env)) {
    const url = migrationDatabaseUrl(process.env);
    if (!url) {
      console.error("DATABASE_URL (or DIRECT_URL) must be set to run migrations.");
      process.exit(1);
    }
    console.log("Applying database migrations...");
    run("npx", ["prisma", "migrate", "deploy"], { DATABASE_URL: url });
  } else {
    console.log(
      `Skipping migrations (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}). Set RUN_MIGRATIONS=1 to force them.`
    );
  }

  run("npx", ["next", "build"]);
}
