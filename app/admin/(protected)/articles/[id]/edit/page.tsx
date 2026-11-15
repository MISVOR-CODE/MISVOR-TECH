import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/ArticleForm";
import type { ArticleDTO } from "@/types";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Edit article</h1>
      <div className="mt-6 max-w-2xl">
        <ArticleForm initial={article as unknown as ArticleDTO} articleId={article.id} />
      </div>
    </div>
  );
}
