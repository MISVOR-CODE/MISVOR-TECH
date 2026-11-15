-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('EN', 'ES', 'FR');

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "locale" "Locale" NOT NULL DEFAULT 'ES',
ADD COLUMN     "searchVector" tsvector;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "nameEn" TEXT,
ADD COLUMN     "nameFr" TEXT;

-- CreateIndex
CREATE INDEX "Article_locale_status_publishedAt_idx" ON "Article"("locale", "status", "publishedAt");
