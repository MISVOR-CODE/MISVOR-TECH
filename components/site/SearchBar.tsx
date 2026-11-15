"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";

type Suggestion = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  categoryName: string | null;
};

const DEBOUNCE_MS = 250;

export function SearchBar({ onClose }: { onClose?: () => void }) {
  const t = useTranslations("search");
  const locale = useLocale();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) return;

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const params = new URLSearchParams({ q: trimmed, locale, mode: "autocomplete" });
        const res = await fetch(`/api/search?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        setSuggestions(data.results ?? []);
        setOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, locale]);

  // State resets live in the event handler (not the effect) so typing never
  // triggers a cascading render; the effect only schedules the debounced fetch.
  function handleChange(value: string) {
    setQuery(value);
    if (value.trim()) {
      setLoading(true);
    } else {
      abortRef.current?.abort();
      setSuggestions([]);
      setLoading(false);
      setOpen(false);
    }
  }

  function goToResultsPage(q: string) {
    if (!q.trim()) return;
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    onClose?.();
  }

  function goToArticle(slug: string) {
    router.push(`/articles/${slug}`);
    onClose?.();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        goToArticle(suggestions[activeIndex].slug);
      } else {
        goToResultsPage(query);
      }
    } else if (e.key === "Escape") {
      onClose?.();
    }
  }

  const listboxId = "header-search-listbox";

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 rounded-sm border border-brass/60 bg-vellum px-4 py-2.5 shadow-sm">
        <SearchIcon />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-label={t("ariaLabel")}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={t("placeholder")}
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none"
        />
        {loading && <Spinner />}
      </div>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-black/10 bg-white p-2 shadow-lg"
        >
          {suggestions.length === 0 && !loading && (
            <p className="px-3 py-4 text-center text-sm text-ink/50">{t("noResults")}</p>
          )}

          {suggestions.map((item, i) => (
            <button
              key={item.id}
              id={`search-option-${i}`}
              role="option"
              aria-selected={activeIndex === i}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => goToArticle(item.slug)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                activeIndex === i ? "bg-brand-light/60" : "hover:bg-black/5"
              }`}
            >
              <span className="block font-medium text-ink">{item.title}</span>
              {item.categoryName && (
                <span className="mt-0.5 block text-xs text-brand-dark">{item.categoryName}</span>
              )}
            </button>
          ))}

          {query.trim() && (
            <button
              onClick={() => goToResultsPage(query)}
              className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-brand-dark hover:bg-black/5"
            >
              {t("viewAllResults", { query: query.trim() })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-ink/40">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 shrink-0 animate-spin text-brand" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
