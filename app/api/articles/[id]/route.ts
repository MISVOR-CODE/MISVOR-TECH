import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { dispatchWebhookEvent } from "@/lib/webhooks";
import { sendPushToAll } from "@/lib/push";
import { sendEmailToSubscribers } from "@/lib/email";

// Sends push + email notifications inside the request; allow extra runtime.
export const maxDuration = 60;

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  excerpt: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  locale: z.enum(["EN", "ES", "FR"]).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  coverMediaUrl: z.string().url().optional(),
  coverMediaType: z.enum(["IMAGE", "VIDEO", "GALLERY"]).optional(),
  categoryId: z.string().optional()
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
    include: { category: true, media: { orderBy: { position: "asc" } } }
  });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Drafts and archived articles are only visible to editors. Everyone else
  // gets the same 404 as a missing article, so ids can't be probed.
  if (article.status !== "PUBLISHED") {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session || !["ADMIN", "EDITOR"].includes(role ?? "")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  return NextResponse.json({ article });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !["ADMIN", "EDITOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const json = await req.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const isNewlyPublished = data.status === "PUBLISHED" && existing.status !== "PUBLISHED";

  const article = await prisma.article.update({
    where: { id },
    data: {
      ...data,
      publishedAt: isNewlyPublished ? new Date() : undefined
    },
    include: { category: true, media: true }
  });

  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/${article.locale.toLowerCase()}/articles/${article.slug}`;

  if (isNewlyPublished) {
    await Promise.allSettled([
      dispatchWebhookEvent({ event: "article.published", data: { article, url } }),
      sendPushToAll({ title: article.title, body: article.excerpt, url }, article.categoryId),
      sendEmailToSubscribers(
        { subject: article.title, heading: article.title, summary: article.excerpt, url },
        article.categoryId
      )
    ]);
  } else {
    await dispatchWebhookEvent({ event: "article.updated", data: { article, url } });
  }

  return NextResponse.json({ article });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.article.delete({ where: { id } });
  await dispatchWebhookEvent({ event: "article.deleted", data: { id } });

  return NextResponse.json({ ok: true });
}
