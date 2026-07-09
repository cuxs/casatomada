import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/basic-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_ITEM_COUNT = 99;

// POST /api/guardarropa/checks — register items left at the coat check,
// linked to the guest's ticket (found by its animal code word).
export async function POST(request: NextRequest) {
  const authResponse = checkApiAuth(request, "guardarropa");
  if (authResponse) return authResponse;

  const body = await request.json();
  const { saleId, itemCount, description } = body as {
    saleId?: string;
    itemCount?: number;
    description?: string;
  };

  if (!saleId?.trim()) {
    return NextResponse.json(
      { error: "El ticket es requerido" },
      { status: 400 },
    );
  }

  if (
    typeof itemCount !== "number" ||
    !Number.isInteger(itemCount) ||
    itemCount < 1 ||
    itemCount > MAX_ITEM_COUNT
  ) {
    return NextResponse.json(
      { error: `La cantidad de objetos debe ser entre 1 y ${MAX_ITEM_COUNT}` },
      { status: 400 },
    );
  }

  try {
    const check = await prisma.guardarropaCheck.create({
      data: {
        saleId: saleId.trim(),
        itemCount,
        description: description?.trim() ?? "",
      },
      include: {
        sale: { select: { codeWord: true, buyerName: true } },
      },
    });
    return NextResponse.json(check, { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "No se encontró el ticket" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Error al guardar en el guardarropa" },
      { status: 500 },
    );
  }
}

// GET /api/guardarropa/checks?saleId=xxx — active (not yet retrieved) and
// already-retrieved deposits for a ticket, used by the retrieve screen.
export async function GET(request: NextRequest) {
  const authResponse = checkApiAuth(request, "guardarropa");
  if (authResponse) return authResponse;

  const { searchParams } = new URL(request.url);
  const saleId = searchParams.get("saleId")?.trim();

  if (!saleId) {
    return NextResponse.json(
      { error: "El ticket es requerido" },
      { status: 400 },
    );
  }

  try {
    const [checks, retrievedChecks] = await Promise.all([
      prisma.guardarropaCheck.findMany({
        where: { saleId, retrievedAt: null },
        orderBy: { createdAt: "asc" },
      }),
      prisma.guardarropaCheck.findMany({
        where: { saleId, retrievedAt: { not: null } },
        orderBy: { retrievedAt: "desc" },
      }),
    ]);
    return NextResponse.json({ checks, retrievedChecks });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener los depósitos" },
      { status: 500 },
    );
  }
}
