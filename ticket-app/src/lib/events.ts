import { prisma } from "@/lib/prisma";

export function listEvents() {
  return prisma.event.findMany({ orderBy: { date: "desc" } });
}

export function getActiveEvent() {
  return prisma.event.findFirst({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function resolveEventId(
  explicitId: string | null | undefined,
): Promise<string | null> {
  if (explicitId) return explicitId;
  const active = await getActiveEvent();
  return active?.id ?? null;
}
