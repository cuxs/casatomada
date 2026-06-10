import { NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/basic-auth";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

const VALID_PRICES = [10000, 13000, 15000];

export async function POST(request: NextRequest) {
  const authResponse = checkApiAuth(request);
  if (authResponse) return authResponse;

  const body = await request.json();
  const { buyerName, price, ticketCount: rawTicketCount } = body as {
    buyerName: string;
    price: number;
    ticketCount?: number;
  };

  if (!buyerName?.trim()) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  if (!VALID_PRICES.includes(price)) {
    return NextResponse.json({ error: "El precio no es válido" }, { status: 400 });
  }

  const ticketCount =
    typeof rawTicketCount === "number" && rawTicketCount >= 1
      ? Math.floor(rawTicketCount)
      : 1;

  const qrToken = uuidv4();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const qrUrl = `${appUrl}/check-qr?token=${qrToken}`;

  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 300,
    margin: 2,
    color: { dark: "#111827", light: "#ffffff" },
  });

  await prisma.sale.create({
    data: {
      buyerName: buyerName.trim(),
      price,
      qrToken,
      ticketCount,
    },
  });

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
