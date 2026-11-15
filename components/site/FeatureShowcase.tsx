"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Shafts } from "@/components/fx/Shafts";
import { Scene3D } from "@/components/fx/Scene";
import type { SceneKind } from "@/components/fx/scenes";

const items: { key: "agents" | "workflows" | "data"; scene: SceneKind; href: string }[] = [
  { key: "agents", scene: "neural", href: "/solutions/ai-agents" },
  { key: "workflows", scene: "gears", href: "/solutions/workflow-automation" },
  { key: "data", scene: "bars", href: "/solutions/data-analytics" }
];

const SECONDS = 8;

// One stage for three stories. A tab row sits under the text, and the active tab fills like a
// progress bar. When it is full, the next story takes over: the old text lifts away, the 3D
// object cross-fades and shrinks out, and the new text rises in line by line. Hovering or
// focusing pauses it, scrolling away pauses it, and reduced motion turns autoplay off.
export function FeatureShowcase() {
  const t = useTranslations("features");
  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);
  const [inView, setInView] = useState(false);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const next = () => setIdx((i) => (i + 1) % items.length);

  return (
    <section
      ref={root}
      data-paused={hover || !inView}
      className="showcase surface-night lattice overflow-hidden px-4 py-14 sm:px-6 lg:py-20"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <Shafts
        shafts={[
          { x: "0%", w: "24%", r: "-12deg", a: "0.2", d: "18s" },
          { x: "74%", w: "26%", r: "11deg", a: "0.24", d: "16s" }
        ]}
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2 lg:gap-16">
        <div className="relative mx-auto h-[320px] w-full max-w-[480px] sm:h-[420px] lg:h-[480px]">
          {items.map((it, i) => (
            <div key={it.key} className="scene-layer absolute inset-0" data-active={idx === i}>
              <Scene3D kind={it.scene} active={idx === i} className="h-full w-full" />
            </div>
          ))}
        </div>

        <div>
          <div className="swap min-h-[300px] sm:min-h-[280px]" aria-live="off">
            {items.map((it, i) => (
              <div key={it.key} role="tabpanel" id={`feature-${it.key}`} aria-hidden={idx !== i} data-active={idx === i} className="swap-item max-w-xl">
                <p className="eyebrow">{t(`${it.key}.eyebrow`)}</p>
                <h2 className="mt-4 text-3xl font-medium leading-tight text-[#f6edd6] sm:text-4xl lg:text-[2.7rem]">{t(`${it.key}.title`)}</h2>
                <p className="mt-4 text-base leading-relaxed text-[#d9ceb4] sm:text-lg">{t(`${it.key}.body`)}</p>
                <div>
                  <Link href={it.href} tabIndex={idx === i ? 0 : -1} className="btn-line mt-7">
                    {t(`${it.key}.cta`)}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div role="tablist" aria-label={t("tabsLabel")} className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {items.map((it, i) => (
              <button
                key={it.key}
                role="tab"
                aria-selected={idx === i}
                aria-controls={`feature-${it.key}`}
                data-active={idx === i}
                onClick={() => setIdx(i)}
                className="tab text-left"
              >
                <span className="tab-bar block h-[2px] w-full overflow-hidden bg-brass/25">
                  <i style={{ ["--dur" as string]: `${SECONDS}s` }} onAnimationEnd={next} />
                </span>
                <span className={`mt-2 block text-xs font-medium uppercase tracking-[0.14em] transition-colors sm:text-[0.8rem] ${idx === i ? "text-brass-hi" : "text-[#9c9078] hover:text-[#d9ceb4]"}`}>
                  {t(`${it.key}.eyebrow`)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
