import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTurnstile } from "@/lib/turnstile";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await request.json().catch(() => ({}));
  const { authorName, content, turnstileToken } = body as {
    authorName: string;
    content: string;
    turnstileToken?: string;
  };

  if (!authorName?.trim()) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }
  if (!content?.trim()) {
    return NextResponse.json({ error: "El mensaje es requerido" }, { status: 400 });
  }
  if (authorName.trim().length > 100) {
    return NextResponse.json({ error: "Nombre demasiado largo" }, { status: 400 });
  }
  if (content.trim().length > 500) {
    return NextResponse.json({ error: "Mensaje demasiado largo" }, { status: 400 });
  }

  const valid = await verifyTurnstile(turnstileToken ?? "");
  if (!valid) {
    return NextResponse.json(
      { error: "Verificación de seguridad fallida. Intentá de nuevo." },
      { status: 400 },
    );
  }

  try {
    const comment = await prisma.rideComment.create({
      data: {
        postId: params.id,
        authorName: authorName.trim(),
        content: content.trim(),
      },
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      (err.code === "P2003" || err.code === "P2025")
    ) {
      return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Error al crear el comentario" },
      { status: 500 },
    );
  }
}
