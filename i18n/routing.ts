import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  // Every locale gets an explicit prefix (/en, /es, /fr) rather than hiding
  // it for the default one. That keeps canonical URLs and hreflang alternates
  // unambiguous, and avoids the classic bug where the same page is reachable
  // at both "/" and "/es/" with no canonical relationship between them.
  localePrefix: "always",
  localeCookie: {
    name: "MISVOR_LOCALE"
  }
});

export type Locale = (typeof routing.locales)[number];
