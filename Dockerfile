# syntax=docker/dockerfile:1.7
#
# Multi-stage image for local production parity, CI checks and self-hosting.
# (Vercel does not run this image. It builds the app itself from the repo.)
#
#   docker build -t ogsp .
#   docker build --target migrate -t ogsp-migrate .   # one-shot `prisma migrate deploy`

ARG NODE_VERSION=22

# Debian slim instead of Alpine: Prisma's engines target glibc/OpenSSL 3, so this
# avoids musl surprises.
FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- deps: install with only the files that affect the dependency layer ------
FROM base AS deps
# prisma/ must be present because `postinstall` runs `prisma generate`.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm npm ci

# ---- builder: compile the app as a self-contained standalone bundle ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public

# NEXT_PUBLIC_* values are inlined into the bundle at build time, so they have
# to be supplied here and cannot be changed by runtime env vars.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY=
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY \
    BUILD_STANDALONE=1 \
    DATABASE_URL=postgresql://build:build@localhost:5432/build

# No database or secrets are needed here. The home page falls back to
# placeholder news during the build and ISR refreshes it at runtime.
RUN npm run build

# ---- migrate: one-shot job that applies pending migrations -------------------
FROM builder AS migrate
CMD ["npx", "prisma", "migrate", "deploy"]

# ---- runner: the small image that actually serves traffic --------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs --no-create-home nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Belt and braces: make sure the generated client and its engine binaries are
# present even if file tracing missed them.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
