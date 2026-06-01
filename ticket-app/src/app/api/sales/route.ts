import { NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/basic-auth";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

export async function POST(request: NextRequest) {
  const authResponse = checkApiAuth(request);
  if (authResponse) return authResponse;

  const body = await request.json();
  const { buyerName, promoCode } = body as { buyerName: string; promoCode?: string };

  if (!buyerName?.trim()) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  // Find the active batch
  const batch = await prisma.batch.findFirst({ where: { active: true } });
  if (!batch) {
    return NextResponse.json({ error: "No hay un lote activo en este momento" }, { status: 400 });
  }

  // Check capacity
  if (batch.sold >= batch.total) {
    return NextResponse.json({ error: "Este lote ya no tiene entradas disponibles" }, { status: 400 });
  }

  let ticketCount = 1;
  let promoCodeRecord = null;

  // Handle promo code if provided
  if (promoCode?.trim()) {
    promoCodeRecord = await prisma.promoCode.findUnique({
      where: { code: promoCode.trim().toUpperCase() },
    });

    if (!promoCodeRecord) {
      return NextResponse.json({ error: "El código de promo no es válido" }, { status: 400 });
    }

    if (promoCodeRecord.batchId !== batch.id) {
      return NextResponse.json({ error: "Este código no es válido para el lote activo" }, { status: 400 });
    }

    // Increment uses and determine ticket count
    const updatedPromo = await prisma.promoCode.update({
      where: { id: promoCodeRecord.id },
      data: { uses: { increment: 1 } },
    });

    // Every 3rd use of a promo code generates a 2-ticket QR
    ticketCount = updatedPromo.uses % 3 === 0 ? 2 : 1;
  }

  // Generate unique QR token
  const qrToken = uuidv4();

  // Build the full URL that the QR will encode
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const qrUrl = `${appUrl}/check-qr?token=${qrToken}`;

  // Generate QR as base64 data URL
  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 300,
    margin: 2,
    color: { dark: "#111827", light: "#ffffff" },
  });

  // Create the sale and increment batch sold count in a transaction
  await prisma.$transaction([
    prisma.sale.create({
      data: {
        buyerName: buyerName.trim(),
        promoCodeId: promoCodeRecord?.id ?? null,
        qrToken,
        ticketCount,
        batchId: batch.id,
      },
    }),
    prisma.batch.update({
      where: { id: batch.id },
      data: { sold: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ qrToken, qrDataUrl, ticketCount });
}

export async function GET(request: NextRequest) {
  const authResponse = checkApiAuth(request);
  if (authResponse) return authResponse;

  try {
    const sales = await prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sales);
  } catch {
    return NextResponse.json({ error: "Error al obtener las ventas" }, { status: 500 });
  }
}
