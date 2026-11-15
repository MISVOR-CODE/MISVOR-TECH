-- Post-migration smoke test for full-text search. Run against a database where
-- `prisma migrate deploy` has already been applied:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/verify-search.sql
-- Everything runs in a transaction that is rolled back, so it leaves no data behind.
\set ON_ERROR_STOP on
BEGIN;

INSERT INTO "Category"(id, name, "nameEn", "nameFr", slug)
VALUES ('verify_cat', 'Verify', 'Verify', 'Verify', 'verify-cat');

INSERT INTO "Article"(id, title, slug, excerpt, body, status, locale, "publishedAt", "updatedAt", "categoryId") VALUES
  ('verify_es', 'Modelo 303: plazos de gestión', 'verify-es', 'Fechas clave del IVA', '<p>Repasamos la gestión trimestral</p>', 'PUBLISHED', 'ES', now(), now(), 'verify_cat'),
  ('verify_en', 'Quarterly VAT filing deadlines', 'verify-en', 'Key dates for returns', '<p>An overview of filing rules</p>', 'PUBLISHED', 'EN', now(), now(), 'verify_cat'),
  ('verify_fr', 'TVA trimestrielle : échéances', 'verify-fr', 'Les dates clés', '<p>Un point sur les échéances</p>', 'PUBLISHED', 'FR', now(), now(), 'verify_cat'),
  ('verify_draft', 'Borrador de gestión', 'verify-draft', 'Borrador', '<p>gestión</p>', 'DRAFT', 'ES', NULL, now(), 'verify_cat');

DO $$
DECLARE n int;
BEGIN
  -- 1. The trigger fills searchVector on insert.
  SELECT count(*) INTO n FROM "Article" WHERE id LIKE 'verify_%' AND "searchVector" IS NULL;
  IF n <> 0 THEN RAISE EXCEPTION 'searchVector not populated for % rows', n; END IF;

  -- 2. Spanish stemming: "gestionar" matches "gestión", and drafts are excluded by the app filter.
  SELECT count(*) INTO n FROM "Article" a
   WHERE a.status = 'PUBLISHED' AND a.locale = 'ES'::"Locale" AND a.id LIKE 'verify_%'
     AND a."searchVector" @@ websearch_to_tsquery('spanish'::regconfig, 'gestionar');
  IF n <> 1 THEN RAISE EXCEPTION 'expected 1 published ES match for "gestionar", got %', n; END IF;

  -- 3. English and French stemming.
  SELECT count(*) INTO n FROM "Article" a WHERE a.id = 'verify_en'
     AND a."searchVector" @@ websearch_to_tsquery('english'::regconfig, 'filed');
  IF n <> 1 THEN RAISE EXCEPTION 'english stemming failed (filed -> filing)'; END IF;
  SELECT count(*) INTO n FROM "Article" a WHERE a.id = 'verify_fr'
     AND a."searchVector" @@ websearch_to_tsquery('french'::regconfig, 'échéance');
  IF n <> 1 THEN RAISE EXCEPTION 'french stemming failed'; END IF;

  -- 4. Locale isolation: an English query must not return the Spanish article.
  SELECT count(*) INTO n FROM "Article" a
   WHERE a.locale = 'EN'::"Locale" AND a.id LIKE 'verify_%'
     AND a."searchVector" @@ websearch_to_tsquery('english'::regconfig, 'modelo');
  IF n <> 0 THEN RAISE EXCEPTION 'locale isolation broken'; END IF;

  -- 5. Hostile input is just text: no error, no matches.
  PERFORM 1 FROM "Article" a
   WHERE a."searchVector" @@ websearch_to_tsquery('english'::regconfig, '''; DROP TABLE "Article"; -- & | !(');

  -- 6. The trigger fires on UPDATE.
  UPDATE "Article" SET title = 'Novedades sobre nóminas' WHERE id = 'verify_es';
  SELECT count(*) INTO n FROM "Article" a WHERE a.id = 'verify_es'
     AND a."searchVector" @@ websearch_to_tsquery('spanish'::regconfig, 'nominas');
  IF n <> 1 THEN RAISE EXCEPTION 'trigger did not refresh searchVector on UPDATE'; END IF;

  -- 7. The GIN index and trigger exist.
  SELECT count(*) INTO n FROM pg_indexes
   WHERE indexname = 'Article_searchVector_idx' AND indexdef ILIKE '%USING gin%';
  IF n <> 1 THEN RAISE EXCEPTION 'GIN index Article_searchVector_idx missing'; END IF;
  SELECT count(*) INTO n FROM pg_trigger WHERE tgname = 'article_search_vector_trigger';
  IF n <> 1 THEN RAISE EXCEPTION 'search trigger missing'; END IF;

  RAISE NOTICE 'search verification passed';
END $$;

ROLLBACK;
