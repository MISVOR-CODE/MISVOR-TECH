"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// A short branded intro shown once per browser session. The CSS animation hides it by
// itself, so it can never trap a visitor, even if JavaScript fails. The effects below
// only remember that it has been seen so later visits and page changes skip it.
export function IntroLoader() {
  const pathname = usePathname();
  const firstPath = useRef(pathname);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      document.documentElement.classList.add("seen");
      try {
        sessionStorage.setItem("mv-seen", "1");
      } catch {
        /* private mode: the intro simply shows again next visit */
      }
      setGone(true);
    }, 1900);
    return () => window.clearTimeout(timer);
  }, []);

  // Moving to another page before the intro ends counts as having seen it.
  useEffect(() => {
    if (pathname !== firstPath.current) document.documentElement.classList.add("seen");
  }, [pathname]);

  if (gone) return null;

  return (
    <div className="loader" aria-hidden="true">
      <div className="loader-inner">
        <div className="loader-mark">
          <Image src="/misvor-mark.webp" alt="" width={730} height={194} priority />
          <span className="loader-shimmer" />
        </div>
        <span className="loader-word">MISVOR</span>
        <span className="loader-tech">Tech</span>
        <span className="loader-bar">
          <i />
        </span>
      </div>
    </div>
  );
}
