import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

interface EmailPayload {
  subject: string;
  heading: string;
  summary: string;
  url: string;
}

// Resend's constructor throws when no API key is set, so the client is created
// on first use instead of at import time (which broke `next build` without keys).
let client: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client ??= new Resend(key);
  return client;
}

// Resend accepts at most 100 messages per batch request.
const BATCH_SIZE = 100;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildEmailHtml({ heading, summary, url }: Pick<EmailPayload, "heading" | "summary" | "url">) {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
      <h1 style="font-size: 20px;">${escapeHtml(heading)}</h1>
      <p style="color: #444;">${escapeHtml(summary)}</p>
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:10px 18px;background:#1c3a5e;color:#fff;border-radius:8px;text-decoration:none;">Leer más</a>
    </div>
  `;
}

export async function sendEmailToSubscribers(payload: EmailPayload, categoryId?: string | null) {
  const users = await prisma.user.findMany({
    where: categoryId
      ? {
          preferences: {
            emailEnabled: true,
            categoryIds: { has: categoryId }
          }
        }
      : { preferences: { emailEnabled: true } },
    select: { email: true }
  });

  if (users.length === 0) return { sent: 0, total: 0 };

  const resend = getClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY is not configured; skipping email notifications.");
    return { sent: 0, total: users.length, skipped: true as const };
  }

  const html = buildEmailHtml(payload);
  const from = process.env.EMAIL_FROM || "news@example.com";

  // One message per recipient: a single message with everyone in `to` would
  // show every subscriber's address to every other subscriber.
  let sent = 0;
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const chunk = users.slice(i, i + BATCH_SIZE);
    try {
      const { error } = await resend.batch.send(
        chunk.map((u) => ({ from, to: [u.email], subject: payload.subject, html }))
      );
      if (error) {
        console.error("[email] batch send failed:", error);
      } else {
        sent += chunk.length;
      }
    } catch (err) {
      console.error("[email] batch send threw:", err);
    }
  }

  return { sent, total: users.length };
}

export type ContactPayload = { name: string; email: string; company?: string; topic?: string; message: string };

/**
 * Sends a contact-form message to the team inbox. Returns "not_configured" when no
 * Resend key is set, so the form can tell the visitor honestly that nothing was sent.
 */
export async function sendContactMessage(payload: ContactPayload): Promise<"sent" | "not_configured" | "failed"> {
  const resend = getClient();
  const to = process.env.CONTACT_TO_EMAIL;
  if (!resend || !to) return "not_configured";
  const rows = [
    ["Name", payload.name],
    ["Email", payload.email],
    ["Company", payload.company || "-"],
    ["Topic", payload.topic || "-"]
  ];
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 560px;">
      <h1 style="font-size: 18px;">New message from the MISVOR website</h1>
      <table>${rows.map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#666">${k}</td><td>${escapeHtml(v)}</td></tr>`).join("")}</table>
      <p style="white-space: pre-wrap; margin-top: 16px;">${escapeHtml(payload.message)}</p>
    </div>`;
  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "MISVOR <news@example.com>",
      to: [to],
      replyTo: payload.email,
      subject: `Website enquiry from ${payload.name}`,
      html
    });
    if (error) {
      console.error("[contact] send failed:", error);
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("[contact] send threw:", err);
    return "failed";
  }
}
