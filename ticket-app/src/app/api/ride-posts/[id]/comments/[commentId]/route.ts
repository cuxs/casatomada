import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/basic-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } },
) {
  const authResponse = checkApiAuth(request);
  if (authResponse) return authResponse;

  try {
    await prisma.rideComment.delete({ where: { id: params.commentId } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Comentario no encontrado" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Error al eliminar el comentario" },
      { status: 500 },
    );
  }
}
