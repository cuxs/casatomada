import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { checkApiAuth } from "@/lib/basic-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH /api/sales/[id] — update a sale's buyer name and/or ticket count
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResponse = checkApiAuth(request);
  if (authResponse) return authResponse;

  const body = await request.json();
  const { buyerName, ticketCount } = body as {
    buyerName?: string;
    ticketCount?: number;
  };

  const data: Prisma.SaleUpdateInput = {};

  if (buyerName !== undefined) {
    if (!buyerName.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }
    data.buyerName = buyerName.trim();
  }

  if (ticketCount !== undefined) {
    if (typeof ticketCount !== "number" || !Number.isInteger(ticketCount) || ticketCount < 1) {
      return NextResponse.json({ error: "La cantidad de entradas no es válida" }, { status: 400 });
    }
    data.ticketCount = ticketCount;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No hay cambios para guardar" }, { status: 400 });
  }

  try {
    const sale = await prisma.sale.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(sale);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error al actualizar la venta" }, { status: 500 });
  }
}
