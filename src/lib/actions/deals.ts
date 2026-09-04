"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { dealSchema, dealStages } from "@/lib/validators";

export type ActionState = { error?: string } | undefined;

function parseDealForm(formData: FormData) {
  return dealSchema.safeParse({
    title: formData.get("title"),
    value: formData.get("value"),
    stage: formData.get("stage"),
    companyId: formData.get("companyId"),
    contactId: formData.get("contactId"),
    expectedCloseDate: formData.get("expectedCloseDate"),
    notes: formData.get("notes"),
  });
}

export async function createDealAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseDealForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { companyId, contactId, expectedCloseDate, notes, ...rest } = parsed.data;

  const deal = await prisma.deal.create({
    data: {
      ...rest,
      companyId: companyId || null,
      contactId: contactId || null,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
      notes: notes || null,
      closedAt: rest.stage === "WON" || rest.stage === "LOST" ? new Date() : null,
    },
  });

  revalidatePath("/deals");
  redirect(`/deals/${deal.id}`);
}

export async function updateDealAction(
  dealId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseDealForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { companyId, contactId, expectedCloseDate, notes, ...rest } = parsed.data;

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      ...rest,
      companyId: companyId || null,
      contactId: contactId || null,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
      notes: notes || null,
      closedAt: rest.stage === "WON" || rest.stage === "LOST" ? new Date() : null,
    },
  });

  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  redirect(`/deals/${dealId}`);
}

export async function updateDealStageAction(dealId: string, stage: (typeof dealStages)[number]) {
  await prisma.deal.update({
    where: { id: dealId },
    data: {
      stage,
      closedAt: stage === "WON" || stage === "LOST" ? new Date() : null,
    },
  });
  revalidatePath("/deals");
}

export async function deleteDealAction(dealId: string) {
  await prisma.deal.delete({ where: { id: dealId } });
  revalidatePath("/deals");
  redirect("/deals");
}
