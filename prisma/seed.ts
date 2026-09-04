import { PrismaClient, DealStage, ActivityType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_USER_EMAIL ?? "demo@orbitcrm.app";
  const password = process.env.SEED_USER_PASSWORD ?? "password123";

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Demo User",
      email,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
  console.log(`Seeded user: ${user.email} (password: ${password})`);

  const acme = await prisma.company.create({
    data: {
      name: "Acme Corporation",
      website: "https://acme.example.com",
      industry: "Manufacturing",
      phone: "+1 555 0100",
      address: "123 Industrial Way, Springfield",
    },
  });

  const globex = await prisma.company.create({
    data: {
      name: "Globex Inc.",
      website: "https://globex.example.com",
      industry: "Software",
      phone: "+1 555 0199",
    },
  });

  const jane = await prisma.contact.create({
    data: {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@acme.example.com",
      phone: "+1 555 0111",
      title: "VP of Operations",
      companyId: acme.id,
    },
  });

  const mark = await prisma.contact.create({
    data: {
      firstName: "Mark",
      lastName: "Chen",
      email: "mark.chen@globex.example.com",
      phone: "+1 555 0122",
      title: "CTO",
      companyId: globex.id,
    },
  });

  const deal1 = await prisma.deal.create({
    data: {
      title: "Acme — Annual Platform License",
      value: 48000,
      stage: DealStage.PROPOSAL,
      companyId: acme.id,
      contactId: jane.id,
      expectedCloseDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
    },
  });

  const deal2 = await prisma.deal.create({
    data: {
      title: "Globex — Implementation Services",
      value: 15000,
      stage: DealStage.QUALIFIED,
      companyId: globex.id,
      contactId: mark.id,
      expectedCloseDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
    },
  });

  await prisma.deal.create({
    data: {
      title: "Acme — Support Renewal",
      value: 9000,
      stage: DealStage.WON,
      companyId: acme.id,
      closedAt: new Date(),
    },
  });

  await prisma.activity.createMany({
    data: [
      {
        type: ActivityType.TASK,
        title: "Send updated proposal to Jane",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        contactId: jane.id,
        dealId: deal1.id,
        companyId: acme.id,
      },
      {
        type: ActivityType.CALL,
        title: "Discovery call with Mark",
        notes: "Discussed integration timeline and rollout plan.",
        completedAt: new Date(),
        contactId: mark.id,
        dealId: deal2.id,
        companyId: globex.id,
      },
      {
        type: ActivityType.TASK,
        title: "Prepare implementation timeline",
        dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
        dealId: deal2.id,
        companyId: globex.id,
      },
      {
        type: ActivityType.NOTE,
        title: "Kickoff notes",
        notes: "Acme wants onboarding to start within 30 days of signing.",
        completedAt: new Date(),
        companyId: acme.id,
      },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
