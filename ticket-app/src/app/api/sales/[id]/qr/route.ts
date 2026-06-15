import { type NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/basic-auth";
import { prisma } from "@/lib/prisma";
import { generateQrDataUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";

// GET /api/sales/[id]/qr — regenerate the QR code for an existing sale
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResponse = checkApiAuth(request);
  if (authResponse) return authResponse;

  const sale = await prisma.sale.findUnique({ where: { id: params.id } });
  if (!sale) {
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  }

  const qrDataUrl = await generateQrDataUrl(sale.qrToken);

  return NextResponse.json({
    qrToken: sale.qrToken,
    qrDataUrl,
    codeWord: sale.codeWord,
    ticketCount: sale.ticketCount,
  });
}
