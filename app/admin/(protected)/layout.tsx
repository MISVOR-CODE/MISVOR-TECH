import Link from "next/link";
import { auth } from "@/lib/auth";

// Auth redirection for unauthenticated visitors is handled in proxy.ts,
// which excludes /admin/login. This layout only needs to handle the
// "signed in but insufficient role" case, avoiding a redirect loop with the
// login page (which lives outside this route group).
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  if (!session) {
    // Middleware should already have redirected; this is a safety fallback
    // for the rare case middleware didn't run (e.g. static export preview).
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-xl font-bold text-ink">Sign in required</h1>
        <p className="mt-2 text-ink/60">
          <Link href="/admin/login" className="text-brand-dark underline">
            Go to the admin login page
          </Link>
          .
        </p>
      </div>
    );
  }

  if (!["ADMIN", "EDITOR"].includes(role ?? "")) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-xl font-bold text-ink">Access pending</h1>
        <p className="mt-2 text-ink/60">
          Your account doesn&apos;t have admin or editor access yet. Ask an administrator to
          upgrade your role.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 sm:px-6">
      <aside className="w-48 shrink-0">
        <nav className="space-y-1 text-sm">
          <Link href="/admin" className="block rounded-lg px-3 py-2 hover:bg-black/5">
            Dashboard
          </Link>
          <Link href="/admin/articles" className="block rounded-lg px-3 py-2 hover:bg-black/5">
            Articles
          </Link>
          <Link href="/admin/articles/new" className="block rounded-lg px-3 py-2 hover:bg-black/5">
            New article
          </Link>
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
