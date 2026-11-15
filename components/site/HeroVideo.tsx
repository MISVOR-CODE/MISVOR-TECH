"use client";

import { useEffect, useRef, useState } from "react";
import { media } from "@/lib/media";

type Props = {
  /** Clip paths. Defaults to media.heroVideos. */
  clips?: readonly string[];
  /** 0 to 1. Defaults to media.heroVideoOpacity. */
  opacity?: number;
  /** Crossfade through all clips (home hero) or just loop the first one (other pages). */
  rotate?: boolean;
  clipSeconds?: number;
};

const FADE_MS = 1200;
const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

// Background video for a hero. Two stacked <video> layers: the next clip loads into the
// hidden one, and only when it can play does the visible one fade out, so nothing ever
// flashes black. Visitors who prefer reduced motion or have data saver on get the
// poster (or the lit background) instead, and playback pauses while the hero is off screen.
export function HeroVideo({ clips = media.heroVideos, opacity = media.heroVideoOpacity, rotate = true, clipSeconds = media.heroClipSeconds }: Props) {
  const list = clips.filter(Boolean);
  const key = list.join("|");
  const box = useRef<HTMLDivElement>(null);
  const a = useRef<HTMLVideoElement>(null);
  const b = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (!list.length) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    if (reduce || saveData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStill(true);
      return;
    }
    const slots = [a.current, b.current];
    if (!slots[0] || !slots[1]) return;
    let cancelled = false;

    const load = (slot: HTMLVideoElement, src: string) =>
      new Promise<void>((resolve) => {
        const done = () => {
          slot.removeEventListener("canplay", done);
          resolve();
        };
        slot.addEventListener("canplay", done);
        slot.src = src;
        slot.load();
        slot.play().catch(() => {
          // Autoplay can be blocked (low-power mode). The lit background is the fallback.
        });
        window.setTimeout(done, 6000);
      });

    (async () => {
      await load(slots[0]!, list[0]);
      if (cancelled) return;
      setReady(true);
      if (!rotate || list.length < 2) {
        slots[0]!.loop = true;
        return;
      }
      let current = 0;
      let index = 0;
      while (!cancelled) {
        await sleep(clipSeconds * 1000);
        if (cancelled) return;
        const hidden = 1 - current;
        index = (index + 1) % list.length;
        await load(slots[hidden]!, list[index]);
        if (cancelled) return;
        setActive(hidden);
        current = hidden;
        await sleep(FADE_MS);
      }
    })();

    const io = new IntersectionObserver(([entry]) => {
      for (const v of slots) {
        if (!v || !v.src) continue;
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      }
    });
    if (box.current) io.observe(box.current);

    return () => {
      cancelled = true;
      io.disconnect();
      slots.forEach((v) => v?.pause());
    };
  }, [key, rotate, clipSeconds]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!list.length && !media.heroPoster) return null;

  const videoProps = { muted: true, playsInline: true, preload: "auto", tabIndex: -1, className: "absolute inset-0 h-full w-full object-cover" } as const;
  const layer = (visible: boolean) => ({ opacity: visible ? opacity : 0, transition: `opacity ${FADE_MS}ms ease-in-out` });

  return (
    <div ref={box} className="pointer-events-none absolute inset-0" aria-hidden>
      {media.heroPoster && (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${media.heroPoster})`, opacity: still || !ready ? opacity : 0, transition: `opacity ${FADE_MS}ms ease` }} />
      )}
      {list.length > 0 && !still && (
        <>
          <video ref={a} {...videoProps} style={layer(ready && active === 0)} />
          <video ref={b} {...videoProps} style={layer(ready && active === 1)} />
        </>
      )}
    </div>
  );
}
