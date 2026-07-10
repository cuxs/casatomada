import { type NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/basic-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/guardarropa/search?query=9f3 — find sales by the last characters
// of their QR token, the short code guardarropa staff write on the hanger.
export async function GET(request: NextRequest) {
  const authResponse = checkApiAuth(request, "guardarropa");
  if (authResponse) return authResponse;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "La búsqueda es requerida" },
      { status: 400 },
    );
  }

  try {
    const sales = await prisma.sale.findMany({
      where: { qrToken: { endsWith: query, mode: "insensitive" } },
      orderBy: { buyerName: "asc" },
      take: 10,
      include: {
        guardarropaChecks: {
          where: { retrievedAt: null },
          select: { id: true },
        },
      },
    });

    return NextResponse.json({
      results: sales.map((sale) => ({
        saleId: sale.id,
        code: sale.qrToken.slice(-3).toUpperCase(),
        buyerName: sale.buyerName,
        activeDeposits: sale.guardarropaChecks.length,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Error al buscar los tickets" },
      { status: 500 },
    );
  }
}
