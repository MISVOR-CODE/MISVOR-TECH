import { ArticleForm } from "@/components/ArticleForm";

export default function NewArticlePage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">New article</h1>
      <div className="mt-6 max-w-2xl">
        <ArticleForm />
      </div>
    </div>
  );
}
