import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendPushToAll } from "@/lib/push";
import { sendEmailToSubscribers } from "@/lib/email";

// Sends push + email notifications inside the request; allow extra runtime.
export const maxDuration = 60;

const schema = z.object({
  articleId: z.string(),
  channels: z.array(z.enum(["push", "email"])).default(["push", "email"])
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !["ADMIN", "EDITOR"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const article = await prisma.article.findUnique({ where: { id: parsed.data.articleId } });
  if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/${article.locale.toLowerCase()}/articles/${article.slug}`;
  const results: Record<string, unknown> = {};

  if (parsed.data.channels.includes("push")) {
    results.push = await sendPushToAll(
      { title: article.title, body: article.excerpt, url },
      article.categoryId
    );
    await prisma.notificationLog.create({
      data: { articleId: article.id, channel: "push", recipientCount: (results.push as { total: number }).total }
    });
  }

  if (parsed.data.channels.includes("email")) {
    results.email = await sendEmailToSubscribers(
      { subject: article.title, heading: article.title, summary: article.excerpt, url },
      article.categoryId
    );
    await prisma.notificationLog.create({
      data: { articleId: article.id, channel: "email", recipientCount: (results.email as { total: number }).total }
    });
  }

  return NextResponse.json({ ok: true, results });
}
