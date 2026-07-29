import { type NextRequest, NextResponse } from "next/server";
import { resolveEventId } from "@/lib/events";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/qr/lookup?codeWord=...&suffix=... — find a sale by its
// "palabra clave" plus the last 3 characters of its QR token. codeWords are
// only unique within an event, and this door-facing page has no event
// selection of its own, so the lookup is scoped to the active event.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const codeWord = searchParams.get("codeWord")?.trim().toLowerCase() ?? "";
  const suffix = searchParams.get("suffix")?.trim().toLowerCase() ?? "";

  if (!codeWord || suffix.length !== 3) {
    return NextResponse.json({ found: false });
  }

  const eventId = await resolveEventId(null);
  if (!eventId) {
    return NextResponse.json({ found: false });
  }

  const sale = await prisma.sale.findUnique({
    where: { eventId_codeWord: { eventId, codeWord } },
  });

  if (!sale?.qrToken.toLowerCase().endsWith(suffix)) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    used: sale.used,
    outdated: sale.outdated,
    buyerName: sale.buyerName,
    ticketCount: sale.ticketCount,
    usedAt: sale.usedAt,
    qrToken: sale.qrToken,
  });
}
