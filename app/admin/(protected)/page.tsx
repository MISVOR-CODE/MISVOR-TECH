import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [total, published, drafts, subscribers] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.article.count({ where: { status: "DRAFT" } }),
    prisma.pushSubscription.count()
  ]);

  const stats = [
    { label: "Total articles", value: total },
    { label: "Published", value: published },
    { label: "Drafts", value: drafts },
    { label: "Push subscribers", value: subscribers }
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-brand-dark">{s.value}</p>
            <p className="text-sm text-ink/60">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
