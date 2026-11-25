import type { ReactNode } from "react";

export function SectionTitle({ title, intro, dark }: { title: string; intro?: string; dark?: boolean }) {
  return (
    <>
      <h2 className={`max-w-3xl text-3xl font-medium leading-tight sm:text-4xl ${dark ? "text-[#f6edd6]" : "text-ink"}`}>{title}</h2>
      <div className="rule-double mt-5 w-24" />
      {intro && <p className={`mt-5 max-w-2xl text-base leading-relaxed sm:text-lg ${dark ? "text-[#d9ceb4]" : "text-ink/75"}`}>{intro}</p>}
    </>
  );
}

export function CheckList({ items, dark }: { items: string[]; dark?: boolean }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${dark ? "border-brass/70 text-brass-hi" : "border-brass-deep/70 text-brass-deep"}`}>
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <span className={`text-base leading-relaxed ${dark ? "text-[#e4dac0]" : "text-ink/85"}`}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Framed({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`plaque beam p-6 sm:p-8 ${className}`}>
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
