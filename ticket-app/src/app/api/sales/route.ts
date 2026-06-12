import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { checkApiAuth } from "@/lib/basic-auth";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { codeWordForIndex, TOTAL_CODE_WORDS } from "@/lib/code-words";

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

  const salesCount = await prisma.sale.count();

  let codeWord = "";
  let created = false;
  for (let attempt = 0; attempt < TOTAL_CODE_WORDS; attempt++) {
    codeWord = codeWordForIndex(salesCount + attempt);
    try {
      await prisma.sale.create({
        data: {
          buyerName: buyerName.trim(),
          price,
          qrToken,
          codeWord,
          ticketCount,
        },
      });
      created = true;
      break;
    } catch (err) {
      const isCodeWordCollision =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        (err.meta?.target as string[] | undefined)?.includes("codeWord");

      if (!isCodeWordCollision) throw err;
    }
  }

  if (!created) {
    return NextResponse.json(
      { error: "No se pudo generar una palabra clave única" },
      { status: 500 }
    );
  }

  return NextResponse.json({ qrToken, qrDataUrl, codeWord, ticketCount });
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
