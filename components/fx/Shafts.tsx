import type { CSSProperties } from "react";

type Shaft = { x: string; w: string; r: string; a: string; d: string };

const defaults: Shaft[] = [
  { x: "6%", w: "20%", r: "-14deg", a: "0.26", d: "17s" },
  { x: "28%", w: "26%", r: "-5deg", a: "0.4", d: "13s" },
  { x: "52%", w: "18%", r: "8deg", a: "0.3", d: "19s" },
  { x: "70%", w: "24%", r: "16deg", a: "0.34", d: "15s" }
];

// Slow shafts of light falling from above, drawn in CSS so they cost almost nothing.
export function Shafts({ shafts = defaults }: { shafts?: Shaft[] }) {
  return (
    <div className="shafts" aria-hidden>
      {shafts.map((s, i) => (
        <i key={i} style={{ "--x": s.x, "--w": s.w, "--r": s.r, "--a": s.a, "--d": s.d } as CSSProperties} />
      ))}
    </div>
  );
}
