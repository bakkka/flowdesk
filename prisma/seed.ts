import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "./demo-data";

const prisma = new PrismaClient();

async function main() {
  console.log("→ Seeding Flowdesk demo data…");
  await seedDatabase(prisma);
  const [users, payments, events] = await Promise.all([
    prisma.user.count(),
    prisma.payment.count(),
    prisma.event.count(),
  ]);
  console.log(`✔ Done: ${users} users, ${payments} payments, ${events} events`);
  console.log("  Admin: admin@flowdesk.app / flowdesk");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
