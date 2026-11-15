export type ArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type MediaType = "IMAGE" | "VIDEO" | "GALLERY";
export type ContentLocale = "EN" | "ES" | "FR";

export interface ArticleMediaItem {
  id: string;
  url: string;
  type: MediaType;
  alt?: string | null;
  position: number;
}

export interface ArticleDTO {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  status: ArticleStatus;
  locale: ContentLocale;
  coverMediaUrl: string | null;
  coverMediaType: MediaType;
  publishedAt: string | null;
  category?: { id: string; name: string; nameEn?: string | null; nameFr?: string | null; slug: string } | null;
  media: ArticleMediaItem[];
}
