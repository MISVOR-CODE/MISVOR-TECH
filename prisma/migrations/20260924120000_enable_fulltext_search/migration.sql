-- Full-text search for Article content: tsvector trigger + GIN index.
--
-- This is the same SQL as prisma/sql/enable-search.sql, promoted to a real
-- migration so `prisma migrate deploy` (Vercel build, Docker `migrate` service,
-- CI) installs it automatically instead of needing a manual `psql` step.
-- Every statement is idempotent (CREATE OR REPLACE / DROP ... IF EXISTS /
-- CREATE INDEX IF NOT EXISTS), so it is also safe on databases where the
-- manual script was already run.

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
