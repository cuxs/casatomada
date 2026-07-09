import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTurnstile } from "@/lib/turnstile";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const posts = await prisma.ridePost.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(posts);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener los posts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { authorName, content, phone, turnstileToken } = body as {
    authorName: string;
    content: string;
    phone?: string;
    turnstileToken?: string;
  };

  if (!authorName?.trim()) {
    return NextResponse.json(
      { error: "El nombre es requerido" },
      { status: 400 },
    );
  }
  if (!content?.trim()) {
    return NextResponse.json(
      { error: "El mensaje es requerido" },
      { status: 400 },
    );
  }
  if (authorName.trim().length > 100) {
    return NextResponse.json(
      { error: "Nombre demasiado largo" },
      { status: 400 },
    );
  }
  if (content.trim().length > 1000) {
    return NextResponse.json(
      { error: "Mensaje demasiado largo" },
      { status: 400 },
    );
  }
  if (phone && phone.trim().length > 30) {
    return NextResponse.json(
      { error: "Número demasiado largo" },
      { status: 400 },
    );
  }

  const valid = await verifyTurnstile(turnstileToken ?? "");
  if (!valid) {
    return NextResponse.json(
      { error: "Verificación de seguridad fallida. Intentá de nuevo." },
      { status: 400 },
    );
  }

  try {
    const post = await prisma.ridePost.create({
      data: {
        authorName: authorName.trim(),
        content: content.trim(),
        phone: phone?.trim() || null,
      },
    });
    return NextResponse.json(post, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear el post" },
      { status: 500 },
    );
  }
}
