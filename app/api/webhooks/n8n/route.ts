import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import slugify from "slugify";
import { prisma } from "@/lib/prisma";
import { verifyIncomingSignature } from "@/lib/webhooks";
import { sendPushToAll } from "@/lib/push";
import { sendEmailToSubscribers } from "@/lib/email";

// Sends push + email notifications inside the request; allow extra runtime.
export const maxDuration = 60;

// n8n calls this endpoint (e.g. from a "Webhook" -> "HTTP Request" node) to create
// or publish articles as part of an automated workflow (RSS ingestion, translation
// pipelines, moderation approval, scheduled publishing, etc).

const payloadSchema = z.object({
  action: z.enum(["create_article", "publish_article"]),
  title: z.string().optional(),
  excerpt: z.string().optional(),
  body: z.string().optional(),
  locale: z.enum(["EN", "ES", "FR"]).default("ES"),
  coverMediaUrl: z.string().url().optional(),
  categoryId: z.string().optional(),
  articleId: z.string().optional()
});

export async function POST(req: NextRequest) {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  const signature = req.headers.get("x-webhook-signature");
  const rawBody = await req.text();

  if (!secret || !signature || !verifyIncomingSignature(secret, rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  if (data.action === "create_article") {
    if (!data.title || !data.excerpt || !data.body) {
      return NextResponse.json({ error: "title, excerpt, body required" }, { status: 400 });
    }

    const article = await prisma.article.create({
      data: {
        title: data.title,
        slug: slugify(data.title, { lower: true, strict: true }),
        excerpt: data.excerpt,
        body: data.body,
        locale: data.locale,
        coverMediaUrl: data.coverMediaUrl,
        categoryId: data.categoryId,
        status: "DRAFT"
      }
    });

    return NextResponse.json({ ok: true, articleId: article.id });
  }

  if (data.action === "publish_article" && data.articleId) {
    const article = await prisma.article.update({
      where: { id: data.articleId },
      data: { status: "PUBLISHED", publishedAt: new Date() }
    });

    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/${article.locale.toLowerCase()}/articles/${article.slug}`;

    await Promise.allSettled([
      sendPushToAll({ title: article.title, body: article.excerpt, url }, article.categoryId),
      sendEmailToSubscribers(
        { subject: article.title, heading: article.title, summary: article.excerpt, url },
        article.categoryId
      )
    ]);

    return NextResponse.json({ ok: true, articleId: article.id });
  }

  return NextResponse.json({ error: "Unhandled action" }, { status: 400 });
}
