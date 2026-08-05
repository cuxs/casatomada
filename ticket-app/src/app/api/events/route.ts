import { type NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/basic-auth";
import { listEvents } from "@/lib/events";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authResponse = checkApiAuth(request);
  if (authResponse) return authResponse;

  try {
    const events = await listEvents();
    return NextResponse.json(events);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener los eventos" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const authResponse = checkApiAuth(request);
  if (authResponse) return authResponse;

  const body = await request.json().catch(() => ({}));
  const { name, date } = body as { name?: string; date?: string };

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "El nombre es requerido" },
      { status: 400 },
    );
  }

  const parsedDate = date ? new Date(date) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json(
      { error: "La fecha no es válida" },
      { status: 400 },
    );
  }

  try {
    const event = await prisma.$transaction(async (tx) => {
      await tx.event.updateMany({
        where: { active: true },
        data: { active: false },
      });
      return tx.event.create({
        data: { name: name.trim(), date: parsedDate, active: true },
      });
    });

    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear el evento" },
      { status: 500 },
    );
  }
}
