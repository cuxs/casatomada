import { type NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/basic-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/guardarropa/search?query=capi — find sales by code word so the
// guardarropa staff can identify a guest by their ticket's animal.
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
      where: { codeWord: { contains: query, mode: "insensitive" } },
      orderBy: { codeWord: "asc" },
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
        codeWord: sale.codeWord,
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
