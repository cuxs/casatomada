import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/qr/[token] — fetch sale info for a given QR token
export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  const sale = await prisma.sale.findUnique({
    where: { qrToken: token },
  });

  if (!sale) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    used: sale.used,
    buyerName: sale.buyerName,
    ticketCount: sale.ticketCount,
    usedAt: sale.usedAt,
  });
}

// POST /api/qr/[token] — mark a QR as used
export async function POST(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  const sale = await prisma.sale.findUnique({ where: { qrToken: token } });

  if (!sale) {
    return NextResponse.json({ error: "QR not found" }, { status: 404 });
  }

  if (sale.used) {
    return NextResponse.json({ error: "QR already used" }, { status: 400 });
  }

  const updated = await prisma.sale.update({
    where: { qrToken: token },
    data: { used: true, usedAt: new Date() },
  });

  return NextResponse.json({
    found: true,
    used: updated.used,
    buyerName: updated.buyerName,
    ticketCount: updated.ticketCount,
    usedAt: updated.usedAt,
  });
}
