import { ArticleCard } from "@/components/ArticleCard";
import type { ArticleDTO } from "@/types";

export function ArticleGrid({ articles }: { articles: ArticleDTO[] }) {
  if (articles.length === 0) {
    return <p className="py-16 text-center text-ink/60">No articles published yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
