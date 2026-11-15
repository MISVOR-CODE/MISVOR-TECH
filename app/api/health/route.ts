import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Never cache: health checks must reflect the current state.
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/**
 * Liveness/readiness probe (used by the Docker healthcheck and easy to point a
 * monitor at).
 *   GET /api/health          -> 200 as soon as the server is up (no DB access)
 *   GET /api/health?deep=1   -> also checks the database, 503 if unreachable
 */
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("deep") !== "1") {
    return NextResponse.json({ status: "ok" }, { headers: noStore });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up" }, { headers: noStore });
  } catch {
    // Deliberately no error details in the response.
    return NextResponse.json({ status: "error", db: "down" }, { status: 503, headers: noStore });
  }
}
