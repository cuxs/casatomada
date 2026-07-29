import { type NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/basic-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/events/[id]/end — freezes new sales for this event and marks
// every one of its existing tickets as outdated.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResponse = checkApiAuth(request);
  if (authResponse) return authResponse;

  const event = await prisma.event.findUnique({ where: { id: params.id } });

  if (!event) {
    return NextResponse.json(
      { error: "Evento no encontrado" },
      { status: 404 },
    );
  }

  if (event.ended) {
    return NextResponse.json(
      { error: "Este evento ya finalizó" },
      { status: 400 },
    );
  }

  const [updatedEvent] = await prisma.$transaction([
    prisma.event.update({
      where: { id: event.id },
      data: { ended: true, active: false },
    }),
    prisma.sale.updateMany({
      where: { eventId: event.id },
      data: { outdated: true },
    }),
  ]);

  return NextResponse.json(updatedEvent);
}
