import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Use these instead of next/link and next/navigation anywhere inside
// app/[locale]/** — they automatically read/write the locale segment so
// links and redirects stay on the current language without every call site
// having to thread the locale through by hand.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
