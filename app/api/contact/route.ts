import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactMessage } from "@/lib/email";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  company: z.string().trim().max(160).optional(),
  topic: z.string().trim().max(80).optional(),
  message: z.string().trim().min(10).max(5000),
  // Honeypot: real visitors never see or fill this field.
  website: z.string().max(0).optional()
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    // A filled honeypot is a bot. Answer as if it worked and drop the message.
    const honey = typeof body === "object" && body !== null && "website" in body && (body as { website?: unknown }).website;
    if (honey) return NextResponse.json({ ok: true });
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { website: _website, ...payload } = parsed.data;
  void _website;
  const result = await sendContactMessage(payload);
  if (result === "sent") return NextResponse.json({ ok: true });
  return NextResponse.json({ error: result }, { status: result === "not_configured" ? 503 : 502 });
}
