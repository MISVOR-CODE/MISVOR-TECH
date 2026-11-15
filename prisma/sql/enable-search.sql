-- Enterprise-grade full-text search for Article content.
--
-- Why this approach instead of ILIKE or an external search service:
--   - Postgres full-text search (tsvector + GIN index) scales to hundreds of
--     thousands of rows with sub-millisecond lookups, no extra infrastructure,
--     no extra vendor, no data leaving the database.
--   - The vector is kept in sync by a trigger, not application code, so it can
--     never drift out of date regardless of which code path writes an article
--     (admin UI, n8n webhook, seed script, a future bulk import...).
--   - Each row is stemmed with the Postgres text-search config that matches
--     its own locale (english/spanish/french), so "gestión" still matches
--     "gestionar" and "filing" still matches "filed" — a plain ILIKE can't do
--     that, and a single shared config would stem the wrong language.
--   - Fields are weighted (title > excerpt > body) so a title match ranks
--     above an incidental mention buried in body copy.
--
-- If content volume or requirements grow past what this comfortably covers
-- (typo tolerance, cross-language search, faceted search UI at scale),
-- swap this for Meilisearch/Typesense/Algolia behind the same lib/search.ts
-- interface — nothing above that layer needs to change.
--
-- Run once after `prisma migrate dev` (which creates the empty
-- "searchVector" column from schema.prisma but knows nothing about the
-- trigger/index below, since both live outside Prisma's type system):
--   psql "$DATABASE_URL" -f prisma/sql/enable-search.sql
-- or: npm run db:search:setup

CREATE OR REPLACE FUNCTION article_search_vector_update() RETURNS trigger AS $$
DECLARE
  ts_config regconfig;
BEGIN
  ts_config := CASE NEW."locale"
    WHEN 'EN' THEN 'english'::regconfig
    WHEN 'FR' THEN 'french'::regconfig
    ELSE 'spanish'::regconfig
  END;

  NEW."searchVector" :=
    setweight(to_tsvector(ts_config, coalesce(NEW."title", '')), 'A') ||
    setweight(to_tsvector(ts_config, coalesce(NEW."excerpt", '')), 'B') ||
    setweight(to_tsvector(ts_config, coalesce(NEW."body", '')), 'C');

  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS article_search_vector_trigger ON "Article";
CREATE TRIGGER article_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "title", "excerpt", "body", "locale" ON "Article"
  FOR EACH ROW EXECUTE FUNCTION article_search_vector_update();

-- Backfill rows that existed before the trigger did.
UPDATE "Article" SET "title" = "title";

CREATE INDEX IF NOT EXISTS "Article_searchVector_idx" ON "Article" USING GIN ("searchVector");
