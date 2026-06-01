import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const batch = await prisma.batch.findFirst({
    where: { active: true },
  });

  if (!batch) {
    return NextResponse.json({ error: "No active batch found" }, { status: 404 });
  }

  return NextResponse.json({
    id: batch.id,
    name: batch.name,
    price: batch.price,
    total: batch.total,
    sold: batch.sold,
    remaining: batch.total - batch.sold,
  });
}
