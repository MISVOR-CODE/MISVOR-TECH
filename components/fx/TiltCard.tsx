"use client";

import { useRef, type CSSProperties, type ReactNode, type Ref } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Beam colour as "r g b". Defaults to pale brass. */
  beam?: string;
  /** Seconds per full lap of the beam, e.g. "9s". */
  speed?: string;
  /** Maximum tilt in degrees. */
  max?: number;
  ref?: Ref<HTMLDivElement>;
};

// A plaque that leans toward the cursor. Children marked .z1 / .z2 sit at different
// depths, so they shift against each other as the card tilts. Touch screens and
// reduced-motion users get a flat card (handled in globals.css).
export function TiltCard({ children, className = "", beam = "241 217 160", speed = "9s", max = 8, ref }: Props) {
  const el = useRef<HTMLDivElement | null>(null);

  function move(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || !el.current) return;
    const r = el.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.current.style.setProperty("--ry", `${(px - 0.5) * 2 * max}deg`);
    el.current.style.setProperty("--rx", `${-(py - 0.5) * 2 * max}deg`);
    el.current.style.setProperty("--mx", `${px * 100}%`);
    el.current.style.setProperty("--my", `${py * 100}%`);
  }

  function leave() {
    el.current?.style.setProperty("--rx", "0deg");
    el.current?.style.setProperty("--ry", "0deg");
  }

  return (
    <div
      ref={(node) => {
        el.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
      }}
      onPointerMove={move}
      onPointerLeave={leave}
      className={`plaque beam tilt ${className}`}
      style={{ "--beam": beam, "--beam-speed": speed } as CSSProperties}
    >
      {children}
      <span className="glare" aria-hidden />
    </div>
  );
}
