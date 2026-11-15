"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ArticleDTO } from "@/types";

interface Props {
  initial?: Partial<ArticleDTO>;
  articleId?: string;
}

export function ArticleForm({ initial, articleId }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [locale, setLocale] = useState(initial?.locale ?? "ES");
  const [coverMediaUrl, setCoverMediaUrl] = useState(initial?.coverMediaUrl ?? "");
  const [coverMediaType, setCoverMediaType] = useState(initial?.coverMediaType ?? "IMAGE");
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = { title, excerpt, body, locale, coverMediaUrl, coverMediaType, status };
    const res = await fetch(articleId ? `/api/articles/${articleId}` : "/api/articles", {
      method: articleId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(JSON.stringify(data.error));
      return;
    }

    router.push("/admin/articles");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink/80">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Excerpt</label>
          <input
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Language</label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as ArticleDTO["locale"])}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          >
            <option value="ES">Español</option>
            <option value="EN">English</option>
            <option value="FR">Français</option>
          </select>
          <p className="mt-1 text-xs text-ink/50">
            Controls which locale&apos;s visitors see this article, and which search-language config
            (Spanish/English/French stemming) is used to index it.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Cover media URL</label>
          <input
            value={coverMediaUrl}
            onChange={(e) => setCoverMediaUrl(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Media type</label>
          <select
            value={coverMediaType}
            onChange={(e) => setCoverMediaType(e.target.value as ArticleDTO["coverMediaType"])}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          >
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
            <option value="GALLERY">Gallery</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink/80">Body (HTML)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className="w-full rounded-lg border border-black/10 px-3 py-2 font-mono text-sm"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink/80">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ArticleDTO["status"])}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save article"}
      </button>
    </form>
  );
}
