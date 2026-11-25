import Image from "next/image";
import { media } from "@/lib/media";

// The MISVOR gold mark. If media.logo is null the typographic wordmark is used instead.
export function Logo({ className = "" }: { className?: string }) {
  if (media.logo) {
    return (
      <span className={`relative block h-11 w-[6.45rem] lg:h-14 lg:w-[8.2rem] ${className}`}>
        <Image
          src={media.logo}
          alt={media.logoAlt}
          fill
          sizes="132px"
          className="object-contain object-left drop-shadow-[0_0_14px_rgba(241,217,160,0.35)]"
          priority
        />
      </span>
    );
  }
  return (
    <span className={`flex items-center gap-3 ${className}`} aria-label="MISVOR">
      <svg viewBox="0 0 48 48" className="h-10 w-10 shrink-0 text-brass" aria-hidden>
        <circle cx="24" cy="24" r="22.5" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M6 24c6-9 12-9 18 0s12 9 18 0M24 4v40" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <span className="block font-display text-[1.7rem] tracking-[0.2em] text-[#f4ead2]">MISVOR</span>
    </span>
  );
}
