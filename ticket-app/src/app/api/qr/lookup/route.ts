import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/qr/lookup?codeWord=...&suffix=... — find a sale by its
// "palabra clave" plus the last 3 characters of its QR token.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const codeWord = searchParams.get("codeWord")?.trim().toLowerCase() ?? "";
  const suffix = searchParams.get("suffix")?.trim().toLowerCase() ?? "";

  if (!codeWord || suffix.length !== 3) {
    return NextResponse.json({ found: false });
  }

  const sale = await prisma.sale.findUnique({ where: { codeWord } });

  if (!sale?.qrToken.toLowerCase().endsWith(suffix)) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    used: sale.used,
    buyerName: sale.buyerName,
    ticketCount: sale.ticketCount,
    usedAt: sale.usedAt,
    qrToken: sale.qrToken,
  });
}
