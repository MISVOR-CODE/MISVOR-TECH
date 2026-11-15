import { Link } from "@/i18n/navigation";
import { MediaBlock } from "@/components/MediaBlock";
import type { ArticleDTO } from "@/types";

export function ArticleCard({ article }: { article: ArticleDTO }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group block overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:shadow-md"
    >
      {article.coverMediaUrl && (
        <MediaBlock url={article.coverMediaUrl} type={article.coverMediaType} alt={article.title} />
      )}
      <div className="p-4">
        {article.category && (
          <span className="mb-2 inline-block rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-medium text-brand-dark">
            {article.category.name}
          </span>
        )}
        <h3 className="font-display text-lg font-semibold text-ink group-hover:text-brand">
          {article.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink/70">{article.excerpt}</p>
      </div>
    </Link>
  );
}
