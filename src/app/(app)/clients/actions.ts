"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { currentPeriod } from "@/lib/billing";
import { sendReminderEmail } from "@/lib/mailer";

const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  service: z.string().trim().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().trim().min(1).default("USD"),
  dueDay: z.coerce.number().int().min(1).max(28),
  notes: z.string().trim().optional(),
});

function parseClientForm(formData: FormData) {
  return clientSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    service: formData.get("service") || undefined,
    amount: formData.get("amount"),
    currency: formData.get("currency") || "USD",
    dueDay: formData.get("dueDay"),
    notes: formData.get("notes") || undefined,
  });
}

export async function createClient(formData: FormData) {
  const data = parseClientForm(formData);
  const client = await prisma.client.create({ data });
  revalidatePath("/dashboard");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const data = parseClientForm(formData);
  await prisma.client.update({ where: { id }, data });
  revalidatePath("/dashboard");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

export async function deactivateClient(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await prisma.client.update({ where: { id }, data: { active: false } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function reactivateClient(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await prisma.client.update({ where: { id }, data: { active: true } });
  revalidatePath("/dashboard");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

export async function deleteClient(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await prisma.client.delete({ where: { id } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function markClientPaid(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const period = currentPeriod();
  const client = await prisma.client.findUniqueOrThrow({ where: { id } });

  await prisma.payment.upsert({
    where: { clientId_period: { clientId: id, period } },
    update: { amount: client.amount },
    create: { clientId: id, period, amount: client.amount },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}?message=${encodeURIComponent(`Marked as paid for ${period}.`)}`);
}

export async function sendClientReminder(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const period = currentPeriod();
  const client = await prisma.client.findUniqueOrThrow({ where: { id } });

  let message: string;
  try {
    await sendReminderEmail(client, period);
    await prisma.reminder.create({ data: { clientId: id, period } });
    revalidatePath("/dashboard");
    revalidatePath(`/clients/${id}`);
    message = "Reminder sent.";
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    message = `Could not send reminder: ${detail}`;
  }
  redirect(`/clients/${id}?message=${encodeURIComponent(message)}`);
}
