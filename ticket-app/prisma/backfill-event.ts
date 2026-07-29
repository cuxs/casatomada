import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.create({
    data: {
      name: "Casa Tomada Aniversario",
      date: new Date("2026-07-10"),
      active: true,
    },
  });

  // Raw SQL on purpose: this only ever runs during the transient phase where
  // eventId is still nullable in the DB (see the two-step db push in the
  // plan), but schema.prisma is committed with eventId required — so the
  // typed Prisma Client filters no longer accept `null` here.
  const salesUpdated = await prisma.$executeRaw`
    UPDATE "Sale" SET "eventId" = ${event.id}, "outdated" = true WHERE "eventId" IS NULL
  `;
  const ridePostsUpdated = await prisma.$executeRaw`
    UPDATE "RidePost" SET "eventId" = ${event.id} WHERE "eventId" IS NULL
  `;

  console.log(
    `Backfilled into event ${event.id} (${event.name}): ${salesUpdated} sales, ${ridePostsUpdated} ride posts.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
