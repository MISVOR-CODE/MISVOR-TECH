# Deploying OGSP

## How this is set up

Vercel builds Next.js itself and does not run Docker images. So there are two paths that share the same code:

| Path | Purpose |
| --- | --- |
| **Vercel (native)** | Production hosting. Vercel builds from the repo using `vercel.json`. |
| **Docker** | Local production parity, CI smoke tests, and a fallback if you ever self-host (Fly, Railway, a VPS). |

Everything below is in the repo already. You only need to supply a database and environment variables.

## 1. Prerequisites

1. **A hosted Postgres 16 database.** Neon, Supabase or a Vercel Marketplace Postgres all work.
   Create it in the same region as your Vercel functions. `vercel.json` pins functions to `fra1`
   (Frankfurt), so pick a Frankfurt or nearby EU region. If you choose another region, change
   `regions` in `vercel.json`.
2. **Two connection strings** if your provider uses a pooler (Neon, Supabase):
   - `DATABASE_URL`: the pooled URL, used by the running app.
   - `DIRECT_URL`: the direct (non pooled) URL, used only to run migrations.
   Poolers cannot hold Prisma's migration lock. If your URL is already direct, skip `DIRECT_URL`.
3. **Fresh secrets.** The values in a development `.env` are placeholders.
   ```bash
   openssl rand -base64 32    # AUTH_SECRET
   openssl rand -hex 32       # N8N_WEBHOOK_SECRET
   npx web-push generate-vapid-keys   # VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
   ```

## 2. Environment variables

Copy `.env.example` for local work. On Vercel set them under **Project Settings > Environment Variables**.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Pooled URL on Vercel. |
| `DIRECT_URL` | if pooled | Used for migrations only. |
| `AUTH_SECRET` | yes | Sessions cannot be verified without it. |
| `NEXT_PUBLIC_SITE_URL` | yes | Your public origin, for example `https://www.example.com`. **Inlined at build time**, so redeploy after changing it. |
| `N8N_WEBHOOK_SECRET` | if using n8n | The inbound webhook rejects everything without it. |
| `VAPID_*`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | for push | Without them push is skipped with a log line. The public key is inlined at build time. |
| `RESEND_API_KEY`, `EMAIL_FROM` | for email | Without a key, email is skipped with a log line. Verify your sending domain in Resend. |
| `NEXT_PUBLIC_ROBOT_URL` | for MISVOR AI | Public address of the separate `misvor-ai` project on Cloudflare Pages. The "Talk to MISVOR AI" button links there. Inlined at build time, so redeploy after changing it. The Gemini key lives in that project, not here. |
| `GOOGLE_*`, `MICROSOFT_*` | optional | See the redirect URIs below. |
| `IMAGE_REMOTE_HOSTS` | recommended | Comma separated hosts allowed for `next/image`. Unset means any https host, which lets others use your image optimizer. Include every host your editors paste image URLs from. |

Use a **separate database for Preview deployments**. Production deploys run migrations automatically,
previews never do unless you set `RUN_MIGRATIONS=1`.

## 3. Deploy on Vercel

1. Import the repository in Vercel. The framework is detected and `vercel.json` supplies the install and build commands.
2. Add the environment variables for **Production** (and Preview, pointing at a different database).
3. Deploy. The build runs `scripts/vercel-build.mjs`:
   `prisma generate`, then `prisma migrate deploy` (production only), then `next build`.
   The migrations include the full-text search trigger and index, so no manual `psql` step is needed.
4. Create the first admin user. From your machine, pointing at the **direct** URL:
   ```bash
   DATABASE_URL="<direct url>" \
   SEED_ADMIN_EMAIL="you@example.com" \
   SEED_ADMIN_PASSWORD="<a strong password>" \
   npm run seed
   ```
   The seed refuses to run against a non-local database without `SEED_ADMIN_PASSWORD`. It skips the demo
   articles there unless you also set `SEED_SAMPLE_ARTICLES=1`. Sign in at `/admin/login`.
5. OAuth redirect URIs, if you enable them:
   - Google: `https://<your-domain>/api/auth/callback/google`
   - Microsoft Entra ID: `https://<your-domain>/api/auth/callback/microsoft-entra-id`
   OAuth sign-ins get the `READER` role. Promote someone to `EDITOR` or `ADMIN` in the database to give admin access.

### Optional: deploy from GitHub Actions instead

`.github/workflows/deploy-vercel.yml` deploys after CI passes on `main`. It is off by default.
Add the secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` and set the repository variable
`DEPLOY_TO_VERCEL` to `true`. Disconnect Vercel's Git integration first, otherwise every push deploys twice.
The migration step then runs from the GitHub runner, so your database must accept connections from it.

## 4. Docker

```bash
docker compose up -d                       # database only, for local development
docker compose --profile app up --build    # database + migrations + the built app on :3000
```

- The `migrate` service runs `prisma migrate deploy` once and the app waits for it.
- The image is built with the standalone output (`BUILD_STANDALONE=1`) and runs as a non-root user.
- `NEXT_PUBLIC_*` values are baked in at build time. They are passed as build args
  (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`) read from your shell or `.env`.
- `AUTH_TRUST_HOST=true` is set because the app runs in production mode behind a proxy or on plain http.
  Terminate TLS in front of the container if you expose it.
- The image build needs no database. The home page uses placeholder news during the build and refreshes
  through ISR at runtime.
- Health: `GET /api/health` (up) and `GET /api/health?deep=1` (also checks the database, 503 if down).

## 5. Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request:

1. `prisma validate`, type check, lint, and the unit tests.
2. `prisma migrate deploy` on a real Postgres, the seed script, and `scripts/verify-search.sql`
   (stemming in ES/EN/FR, locale isolation, trigger, index).
3. `next build` against that database.
4. A Docker job that brings up the full compose stack and smoke tests the pages, the admin redirect and the API.

Locally: `npm run typecheck`, `npm run lint`, `npm test`.

## 6. What was optimized

- The proxy no longer loads Prisma, bcrypt or the OAuth providers. It runs on every page request.
- Article pages use on-demand ISR (`generateStaticParams` returning an empty list, 60 s revalidate).
- Fonts are variable fonts (one file per family). `next/image` calls have accurate `sizes`.
- Image variants are cached for 31 days and oversized widths (2048 and 3840) are dropped.
- `/api/articles` and `/api/search` are CDN cacheable.
- Static media under `/videos`, `/images`, `/icons` gets a one day cache with stale-while-revalidate.
- Security headers on every response, and the `X-Powered-By` header is removed.

## 7. Recommended next steps (not done)

- **Hero videos.** `HeroPromo` plays up to ten videos with `preload="auto"` on two layers. Compress them
  (H.264 or AV1, a few MB each) and consider hosting them on a CDN or Vercel Blob rather than in `public/`.
- **Sanitize article HTML.** `app/[locale]/articles/[slug]/page.tsx` renders `body` with
  `dangerouslySetInnerHTML`. Any editor, or anyone holding the n8n secret, can inject script into public pages.
  Sanitize on save or on render (for example `sanitize-html`).
- **Slug collisions.** Two articles with the same title produce the same slug and the second create fails with a 500.
- **On-demand revalidation.** Call `revalidatePath` when an article is published so it appears instantly, and
  you can then raise `revalidate` to reduce database load.
- **Rate limiting** on `/api/search`, `/api/articles` and the login endpoint.
- **Content-Security-Policy.** Skipped because it needs nonce handling for Next's inline scripts and should be tested in a browser.
- **Email unsubscribe.** Add a `List-Unsubscribe` header and link. It matters for deliverability and for GDPR.

## Troubleshooting

- **Type errors about missing files under `.next/types`** after pulling: delete the `.next` folder.
- **`Environment variable not found: DATABASE_URL`** during install or build: set it, even to a placeholder, for commands such as `prisma validate`.
- **Migrations hang or fail on a pooled URL:** set `DIRECT_URL` to the non pooled connection string.
- **Login redirects in a loop when self-hosting:** check `AUTH_SECRET` is set and `AUTH_TRUST_HOST=true`.
