"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { activitySchema } from "@/lib/validators";

export type ActionState = { error?: string } | undefined;

export async function createActivityAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = activitySchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    notes: formData.get("notes"),
    dueDate: formData.get("dueDate"),
    contactId: formData.get("contactId"),
    dealId: formData.get("dealId"),
    companyId: formData.get("companyId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { dueDate, notes, contactId, dealId, companyId, ...rest } = parsed.data;

  await prisma.activity.create({
    data: {
      ...rest,
      notes: notes || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      contactId: contactId || null,
      dealId: dealId || null,
      companyId: companyId || null,
      completedAt: rest.type === "NOTE" ? new Date() : null,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (contactId) revalidatePath(`/contacts/${contactId}`);
  if (dealId) revalidatePath(`/deals/${dealId}`);
  if (companyId) revalidatePath(`/companies/${companyId}`);
}

export async function toggleActivityCompleteAction(activityId: string, completed: boolean) {
  const activity = await prisma.activity.update({
    where: { id: activityId },
    data: { completedAt: completed ? new Date() : null },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (activity.contactId) revalidatePath(`/contacts/${activity.contactId}`);
  if (activity.dealId) revalidatePath(`/deals/${activity.dealId}`);
  if (activity.companyId) revalidatePath(`/companies/${activity.companyId}`);
}

export async function deleteActivityAction(activityId: string) {
  const activity = await prisma.activity.delete({ where: { id: activityId } });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (activity.contactId) revalidatePath(`/contacts/${activity.contactId}`);
  if (activity.dealId) revalidatePath(`/deals/${activity.dealId}`);
  if (activity.companyId) revalidatePath(`/companies/${activity.companyId}`);
}
