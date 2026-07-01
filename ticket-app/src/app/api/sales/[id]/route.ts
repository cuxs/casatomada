import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/basic-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_PRICES = [0, 10000, 13000, 15000];

// PATCH /api/sales/[id] — update a sale's buyer name, ticket count, and/or price
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResponse = checkApiAuth(request);
  if (authResponse) return authResponse;

  const body = await request.json();
  const { buyerName, ticketCount, price } = body as {
    buyerName?: string;
    ticketCount?: number;
    price?: number;
  };

  const data: Prisma.SaleUpdateInput = {};

  if (buyerName !== undefined) {
    if (!buyerName.trim()) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 },
      );
    }
    data.buyerName = buyerName.trim();
  }

  if (ticketCount !== undefined) {
    if (
      typeof ticketCount !== "number" ||
      !Number.isInteger(ticketCount) ||
      ticketCount < 1
    ) {
      return NextResponse.json(
        { error: "La cantidad de entradas no es válida" },
        { status: 400 },
      );
    }
    data.ticketCount = ticketCount;
  }

  if (price !== undefined) {
    if (!VALID_PRICES.includes(price)) {
      return NextResponse.json(
        { error: "El precio no es válido" },
        { status: 400 },
      );
    }
    data.price = price;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No hay cambios para guardar" },
      { status: 400 },
    );
  }

  try {
    const sale = await prisma.sale.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(sale);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar la venta" },
      { status: 500 },
    );
  }
}
