# MISVOR rebrand and multi-page build

- Robot hands: idle arms are twisted 85 degrees about their length (REST_TWIST in RobotWalker.tsx), so the elbow bends forward and the palm faces the body, including while walking and flying. The waving or pointing arm untwists to 0, palm to the screen. Left-wall wave now uses the right arm.

- Robot fixes: stage is sized to the window so he never leaves the screen, the designer's wave, open-hand pointing, calmer grounded walk (hips dip, feet stay flat, slower stride), wall positions match the new wider design, soft warm glow instead of haze.

- Robot update: re-ported the upgraded design (robot.ts). Jet flames removed, replaced by a body glow while flying. Natural waving, walking arms and a pointing hand (index finger out, new `pn` joint). He turns to the camera and waves at both walls.

- Home: the three feature bands are now one showcase (FeatureShowcase.tsx) that swaps between AI agents, workflows and data with fade and rise animations, auto-advancing with progress bars and pausing on hover or when off screen.
- New MISVOR AI section (MisvorAi.tsx) with the gold robot ported from Gold_Robot_Mascot.html (components/fx/robot.ts). RobotWalker.tsx loops: lean on the left wall, walk right, fly to the button and point, land, walk to the middle and point again, walk back and lean. He never leaves the screen. Phone layout: lighter pixel ratio, floor raised above the sticky bar, hovers under the button. The button currently links to /contact.
- The Stay up to date news strip moved from the home page to Resources, FAQs.

- Latest: new gold logo (public/icons/misvor-logo-gold.png, new filename so browsers drop the old cached one), stats strip removed from the home page, Industries dropdown opens below the menu line and is nearly opaque, open-book scene rebuilt.

- Brand: OGSP is now MISVOR everywhere users can see it. Gold logo installed (public/icons/misvor-logo.png) and a favicon made from its emblem.
- Header: frosted semi-transparent glass over the hero, firmer once you scroll. The line under it carries travelling beams of light (`NavBeam` in SiteHeader.tsx, styles in globals.css).
- Hero: the armillary sphere is back, rebuilt with engraved brass, a degree-scaled horizon ring, pearls, turned finials and soft shadows. Its central sphere skin is unchanged. The camera frames every scene by its bounding sphere, so nothing is cut off.
- The global-network globe now lives on the About and Industries pages, wearing the same Earth textures as the portfolio (public/images/earth).
- Each industry page has its own 3D object: scales (finance), DNA helix (healthcare), containers (logistics), shopping bag (retail), open book (media), mortarboard (education), turbine and factory (manufacturing), briefcase (professional services).
- Menu line: the light glints are clipped to the line and no longer spill onto the page.
- New 3D scenes in components/fx/scenes.ts: globe, neural core, gears, data bars, shield, document stack. Stage.tsx runs them all.
- Hero backgrounds are videos: HeroVideo.tsx crossfades the clips listed in lib/media.ts (`heroVideos`). Inner pages loop the first clip.
- New pages: solutions (+6 detail pages), industries (+8), about, founder, pricing, contact (+ /api/contact), blog, resources/faqs, legal (notice, privacy, cookies, terms).
- Default language is now English. All copy exists in English, Spanish and French.
- Company details live in lib/site.ts. The WhatsApp number there is still the old one.

---

# Changes from the uploaded project

See `DEPLOYMENT.md` for how to deploy. This file lists what differs from the original so you can review it.

## Removed (stale pre-i18n leftovers, still in your original zip)

- `app/layout.tsx`, `app/page.tsx`, `app/preferences/`, `app/articles/`, `app/admin/old/`
- `app/admin/page.tsx`: an identical copy of `app/admin/(protected)/page.tsx` that sat outside the
  role-checked layout, so any signed-in user (including `READER`) could reach the dashboard.

## Behaviour changes to be aware of

- `GET /api/articles/[id]` returns 404 for DRAFT and ARCHIVED articles unless the caller is an EDITOR or ADMIN.
- `GET /api/articles` returns 400 for an unknown `locale` and treats a bad `page` as 1. Responses are CDN cacheable.
- Notification emails are sent one message per recipient through Resend's batch API, so subscribers no longer see
  each other's addresses. This means more messages per publish, which counts against Resend limits and pricing.
  Email and push are skipped with a log line (instead of crashing) when their keys are not configured.
- The n8n webhook returns 401 for a malformed signature and 400 for invalid JSON (both used to be 500).
- The "send notification" API now builds a locale-prefixed article URL like the other routes.
- Microsoft login uses Auth.js' `microsoft-entra-id` provider. The old `azure-ad` alias ignored `tenantId`.
  The sign-in button and the redirect URI (`/api/auth/callback/microsoft-entra-id`) changed accordingly.
- The admin login page now shows the "Invalid email or password" message (it never could before).
- `npm run seed` refuses a non-local database unless `SEED_ADMIN_PASSWORD` is set, and skips demo articles there.
- Full-text search is installed by a Prisma migration. `prisma/sql/enable-search.sql` and `npm run db:search:setup`
  still work and are safe to run on top of it.
- `postinstall` now runs `prisma generate`. `engines.node` is `22.x`. `@types/node` is `^22` (required by vitest 5).
