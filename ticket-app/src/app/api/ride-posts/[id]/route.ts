import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { checkApiAuth } from "@/lib/basic-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResponse = checkApiAuth(request);
  if (authResponse) return authResponse;

  try {
    await prisma.ridePost.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Post no encontrado" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Error al eliminar el post" },
      { status: 500 },
    );
  }
}
