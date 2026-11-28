"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Variant = "up" | "left" | "right" | "scale" | "fade" | "curtain";

type Props = {
  children: ReactNode;
  variant?: Variant;
  /** Seconds to wait before the reveal starts. Use it to stagger siblings. */
  delay?: number;
  as?: "div" | "li" | "section" | "article" | "span";
  className?: string;
};

// Content eases into place once, the first time it scrolls into view. Only transform,
// opacity and clip-path animate. Without JavaScript, or with reduced motion on,
// everything is simply visible (see globals.css).
export function Reveal({ children, variant = "up", delay = 0, as = "div", className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // `as` only ever picks a plain block-level tag, so one cast keeps the typing simple.
  const Tag = as as "div";
  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      className={className}
      style={{ "--d": `${delay}s` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
