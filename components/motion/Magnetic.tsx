"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

// Buttons lean a few pixels toward the cursor. A small cue that the control is live,
// and it never moves the click target far enough to cause a miss. Mouse only.
export function Magnetic({
  children,
  strength = 0.22,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  function move(e: PointerEvent<HTMLSpanElement>) {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    ref.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  }
  function leave() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <span
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className={`inline-block transition-transform duration-300 ease-out will-change-transform ${className}`}
    >
      {children}
    </span>
  );
}
