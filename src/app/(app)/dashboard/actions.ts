"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentPeriod, statusForClient } from "@/lib/billing";
import { sendReminderEmail } from "@/lib/mailer";

function withMessage(message: string) {
  redirect(`/dashboard?message=${encodeURIComponent(message)}`);
}

export async function markPaid(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return;

  const period = currentPeriod();
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });

  await prisma.payment.upsert({
    where: { clientId_period: { clientId, period } },
    update: { amount: client.amount },
    create: { clientId, period, amount: client.amount },
  });

  revalidatePath("/dashboard");
  withMessage(`Marked ${client.name} as paid for ${period}.`);
}

export async function sendReminder(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return;

  const period = currentPeriod();
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });

  let message: string;
  try {
    await sendReminderEmail(client, period);
    await prisma.reminder.create({ data: { clientId, period } });
    revalidatePath("/dashboard");
    message = `Reminder sent to ${client.name}.`;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    message = `Could not send reminder to ${client.name}: ${detail}`;
  }
  withMessage(message);
}

export async function sendAllOverdueReminders() {
  const period = currentPeriod();
  const clients = await prisma.client.findMany({
    where: { active: true },
    include: { payments: { where: { period } } },
  });

  const overdue = clients.filter(
    (client) => statusForClient(client.dueDay, client.payments.length > 0) === "OVERDUE",
  );

  let sent = 0;
  let failed = 0;
  for (const client of overdue) {
    try {
      await sendReminderEmail(client, period);
      await prisma.reminder.create({ data: { clientId: client.id, period } });
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  revalidatePath("/dashboard");
  if (overdue.length === 0) {
    withMessage("No overdue clients to remind.");
  } else {
    withMessage(`Sent ${sent} reminder(s).${failed > 0 ? ` ${failed} failed.` : ""}`);
  }
}
