import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.sale.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.batch.deleteMany();

  // Create batches
  const batch1 = await prisma.batch.create({
    data: {
      name: "Batch 1 - Community",
      price: 10000,
      total: 150,
      sold: 0,
      active: true,
    },
  });

  await prisma.batch.create({
    data: {
      name: "Batch 2 - General Presale",
      price: 11500,
      total: 200,
      sold: 0,
      active: false,
    },
  });

  await prisma.batch.create({
    data: {
      name: "Batch 3 - Last Call",
      price: 13000,
      total: 150,
      sold: 0,
      active: false,
    },
  });

  // Create promo codes for Batch 1
  await prisma.promoCode.createMany({
    data: [
      { code: "COMUNIDAD01", batchId: batch1.id },
      { code: "COMUNIDAD02", batchId: batch1.id },
      { code: "COMUNIDAD03", batchId: batch1.id },
    ],
  });

  console.log("Seed completed successfully.");
  console.log(`Created 3 batches and 3 promo codes for Batch 1 (id: ${batch1.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
