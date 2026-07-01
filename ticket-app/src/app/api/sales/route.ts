import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { checkApiAuth } from "@/lib/basic-auth";
import { codeWordForIndex, TOTAL_CODE_WORDS } from "@/lib/code-words";
import { generateMockSales } from "@/lib/mock-sales";
import { prisma } from "@/lib/prisma";
import { generateQrDataUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";

// Dev-only: set MOCK_SALES=true to preview the /sales table with 500
// generated rows instead of hitting the database.
const MOCK_SALES =
  process.env.MOCK_SALES === "true" ? generateMockSales(500) : null;

const VALID_PRICES = [0, 10000, 13000, 15000];

export async function POST(request: NextRequest) {
  const authResponse = checkApiAuth(request);
  if (authResponse) return authResponse;

  const body = await request.json();
  const {
    buyerName,
    price,
    ticketCount: rawTicketCount,
  } = body as {
    buyerName: string;
    price: number;
    ticketCount?: number;
  };

  if (!buyerName?.trim()) {
    return NextResponse.json(
      { error: "El nombre es requerido" },
      { status: 400 },
    );
  }

  if (!VALID_PRICES.includes(price)) {
    return NextResponse.json(
      { error: "El precio no es válido" },
      { status: 400 },
    );
  }

  const ticketCount =
    typeof rawTicketCount === "number" && rawTicketCount >= 1
      ? Math.floor(rawTicketCount)
      : 1;

  const qrToken = uuidv4();

  const [qrDataUrl, salesCount] = await Promise.all([
    generateQrDataUrl(qrToken),
    prisma.sale.count(),
  ]);

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
      { status: 500 },
    );
  }

  return NextResponse.json({ qrToken, qrDataUrl, codeWord, ticketCount });
}

export async function GET(request: NextRequest) {
  const authResponse = checkApiAuth(request);
  if (authResponse) return authResponse;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const pageParam = searchParams.get("page");

  const where: Prisma.SaleWhereInput = search
    ? { buyerName: { contains: search, mode: "insensitive" } }
    : {};

  if (MOCK_SALES) {
    const filtered = search
      ? MOCK_SALES.filter((s) =>
          s.buyerName.toLowerCase().includes(search.toLowerCase()),
        )
      : MOCK_SALES;

    if (pageParam !== null) {
      const page = Math.max(1, parseInt(pageParam, 10) || 1);
      const pageSize = Math.min(
        100,
        Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10) || 10),
      );
      const total = filtered.length;
      const totalTickets = filtered.reduce((acc, s) => acc + s.ticketCount, 0);

      return NextResponse.json({
        sales: filtered.slice((page - 1) * pageSize, page * pageSize),
        total,
        totalTickets,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      });
    }

    return NextResponse.json(filtered);
  }

  try {
    if (pageParam !== null) {
      const page = Math.max(1, parseInt(pageParam, 10) || 1);
      const pageSize = Math.min(
        100,
        Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10) || 10),
      );

      const [sales, total, ticketAgg] = await Promise.all([
        prisma.sale.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.sale.count({ where }),
        prisma.sale.aggregate({ where, _sum: { ticketCount: true } }),
      ]);

      return NextResponse.json({
        sales,
        total,
        totalTickets: ticketAgg._sum.ticketCount ?? 0,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      });
    }

    const sales = await prisma.sale.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sales);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener las ventas" },
      { status: 500 },
    );
  }
}
