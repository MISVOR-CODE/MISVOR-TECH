import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

// /admin is a deliberately separate root layout from app/[locale]/layout.tsx —
// it's an internal tool, not a marketing surface, so it isn't localized and
// doesn't carry the public site's header/footer/WhatsApp widget. Next.js
// supports two independent top-level layouts like this as long as neither
// segment shares a layout above it (see "Multiple root layouts" in the
// App Router docs); there's no app/layout.tsx tying the two together.
//
// This layout is intentionally thin (no auth check) because it also wraps
// /admin/login. The session gate + sidebar chrome for the actual protected
// pages lives one level down, in app/admin/(protected)/layout.tsx, so the
// login page itself is never caught behind its own "please sign in" wall.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MISVOR Admin"
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
