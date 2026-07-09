import { type NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/basic-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH /api/guardarropa/checks/[id] — mark a deposit as retrieved.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResponse = checkApiAuth(request, "guardarropa");
  if (authResponse) return authResponse;

  const body = await request.json();
  const { action } = body as { action?: string };

  if (action !== "retrieve") {
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  }

  try {
    // updateMany with the retrievedAt: null guard makes a double-tap or a
    // concurrent retrieval a no-op instead of overwriting the timestamp.
    const { count } = await prisma.guardarropaCheck.updateMany({
      where: { id: params.id, retrievedAt: null },
      data: { retrievedAt: new Date() },
    });

    if (count === 0) {
      const existing = await prisma.guardarropaCheck.findUnique({
        where: { id: params.id },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "No se encontró el depósito" },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Este depósito ya fue retirado" },
        { status: 409 },
      );
    }

    const check = await prisma.guardarropaCheck.findUnique({
      where: { id: params.id },
    });
    return NextResponse.json(check);
  } catch {
    return NextResponse.json(
      { error: "Error al retirar el depósito" },
      { status: 500 },
    );
  }
}
