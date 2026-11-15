import type { ReactNode } from "react";
import { HeroVideo } from "@/components/site/HeroVideo";
import { Shafts } from "@/components/fx/Shafts";
import { Scene3D } from "@/components/fx/Scene";
import type { SceneKind } from "@/components/fx/scenes";
import { media } from "@/lib/media";

type Props = {
  eyebrow: string;
  title: string;
  lead?: string;
  scene?: SceneKind;
  videos?: readonly string[];
  children?: ReactNode;
  compact?: boolean;
};

// The top of every inner page. It slides up under the glass header so the video, the
// light shafts and the 3D object all show through the menu.
export function PageHero({ eyebrow, title, lead, scene, videos, children, compact }: Props) {
  return (
    <section
      id="hero-promo"
      className="surface-night lattice relative -mt-16 overflow-hidden lg:-mt-20"
    >
      <HeroVideo clips={videos ?? media.heroVideos.slice(0, 1)} rotate={false} />
      <div className="hero-scrim" />
      <Shafts />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-night to-transparent" />

      {scene && (
        <div className="absolute inset-x-0 bottom-2 top-16 opacity-40 sm:opacity-70 lg:inset-x-auto lg:right-[3%] lg:top-20 lg:w-[520px] lg:opacity-100">
          <Scene3D kind={scene} className="h-full w-full" />
        </div>
      )}

      <div
        className={`pointer-events-none relative mx-auto flex max-w-7xl flex-col justify-end px-4 pb-12 pt-32 sm:px-6 lg:pb-16 lg:pt-40 ${
          compact ? "min-h-[340px] lg:min-h-[400px]" : "min-h-[440px] lg:min-h-[520px]"
        }`}
      >
        <div className="pointer-events-auto max-w-2xl">
          <p className="eyebrow rise" style={{ animationDelay: "0.05s" }}>
            {eyebrow}
          </p>
          <h1 className="rise mt-5 text-4xl font-medium leading-[1.05] text-[#f6edd6] sm:text-5xl lg:text-6xl" style={{ animationDelay: "0.2s" }}>
            {title}
          </h1>
          {lead && (
            <p className="rise mt-5 max-w-xl text-base leading-relaxed text-[#d9ceb4] sm:text-lg" style={{ animationDelay: "0.4s" }}>
              {lead}
            </p>
          )}
          {children && (
            <div className="rise mt-7 flex flex-wrap gap-3" style={{ animationDelay: "0.55s" }}>
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
