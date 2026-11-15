"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function MobileStickyCTA() {
  const t = useTranslations("mobileCta");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-promo");
    const footer = document.getElementById("site-footer");

    if (!hero || !footer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let heroVisible = false;
        let footerVisible = false;

        for (const entry of entries) {
          if (entry.target.id === "hero-promo") {
            heroVisible = entry.isIntersecting;
          }
          if (entry.target.id === "site-footer") {
            footerVisible = entry.isIntersecting;
          }
        }

        // Show CTA only when hero and footer are both out of view
        setShow(!heroVisible && !footerVisible);
      },
      {
        // Trigger a bit early so it feels smoother
        threshold: 0,
        rootMargin: "0px 0px -40px 0px" // hide when footer is 40px from bottom
      }
    );

    observer.observe(hero);
    observer.observe(footer);

    return () => observer.disconnect();
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brass/50 bg-night/90 p-3 backdrop-blur-md lg:hidden">
      <Link
        href="/contact"
        className="btn-brass w-full"
      >
        {t("quote")}
      </Link>
    </div>
  );
}
