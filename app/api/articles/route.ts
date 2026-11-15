import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import slugify from "slugify";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { dispatchWebhookEvent } from "@/lib/webhooks";
import { sendPushToAll } from "@/lib/push";
import { sendEmailToSubscribers } from "@/lib/email";

// Notifications (push + email) fan out inside the request, so allow the
// function to run longer than the platform default.
export const maxDuration = 60;

const localeSchema = z.enum(["EN", "ES", "FR"]);

const createSchema = z.object({
  title: z.string().min(3),
  excerpt: z.string().min(1),
  body: z.string().min(1),
  locale: z.enum(["EN", "ES", "FR"]).default("ES"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  coverMediaUrl: z.string().url().optional(),
  coverMediaType: z.enum(["IMAGE", "VIDEO", "GALLERY"]).default("IMAGE"),
  categoryId: z.string().optional(),
  media: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.enum(["IMAGE", "VIDEO", "GALLERY"]).default("IMAGE"),
        alt: z.string().optional(),
        position: z.number().default(0)
      })
    )
    .optional()
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const localeParam = searchParams.get("locale")?.toUpperCase();
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = 12;

  const parsedLocale = localeParam ? localeSchema.safeParse(localeParam) : null;
  if (parsedLocale && !parsedLocale.success) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }
  const locale = parsedLocale?.success ? parsedLocale.data : undefined;

  const articles = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      ...(category ? { category: { slug: category } } : {}),
      ...(locale ? { locale } : {})
    },
    orderBy: { publishedAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { category: true, media: { orderBy: { position: "asc" } } }
  });

  // Published-only, anonymous data: safe to cache at the CDN for a short time.
  return NextResponse.json(
    { articles, page, pageSize },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" } }
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !["ADMIN", "EDITOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const slug = slugify(data.title, { lower: true, strict: true });

  const article = await prisma.article.create({
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt,
      body: data.body,
      locale: data.locale,
      status: data.status,
      coverMediaUrl: data.coverMediaUrl,
      coverMediaType: data.coverMediaType,
      categoryId: data.categoryId,
      authorId: session.user?.id,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      media: data.media
        ? { createMany: { data: data.media } }
        : undefined
    },
    include: { category: true, media: true }
  });

  if (article.status === "PUBLISHED") {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/${article.locale.toLowerCase()}/articles/${article.slug}`;

    await Promise.allSettled([
      dispatchWebhookEvent({ event: "article.published", data: { article, url } }),
      sendPushToAll(
        { title: article.title, body: article.excerpt, url },
        article.categoryId
      ),
      sendEmailToSubscribers(
        { subject: article.title, heading: article.title, summary: article.excerpt, url },
        article.categoryId
      )
    ]);
  }

  return NextResponse.json({ article }, { status: 201 });
}
