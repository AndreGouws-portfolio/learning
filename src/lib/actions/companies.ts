"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { companySchema } from "@/lib/validators";

export type ActionState = { error?: string } | undefined;

function parseCompanyForm(formData: FormData) {
  return companySchema.safeParse({
    name: formData.get("name"),
    website: formData.get("website"),
    industry: formData.get("industry"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    notes: formData.get("notes"),
  });
}

export async function createCompanyAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseCompanyForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { website, industry, phone, address, notes, ...rest } = parsed.data;

  const company = await prisma.company.create({
    data: {
      ...rest,
      website: website || null,
      industry: industry || null,
      phone: phone || null,
      address: address || null,
      notes: notes || null,
    },
  });

  revalidatePath("/companies");
  redirect(`/companies/${company.id}`);
}

export async function updateCompanyAction(
  companyId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseCompanyForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { website, industry, phone, address, notes, ...rest } = parsed.data;

  await prisma.company.update({
    where: { id: companyId },
    data: {
      ...rest,
      website: website || null,
      industry: industry || null,
      phone: phone || null,
      address: address || null,
      notes: notes || null,
    },
  });

  revalidatePath("/companies");
  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}`);
}

export async function deleteCompanyAction(companyId: string) {
  await prisma.company.delete({ where: { id: companyId } });
  revalidatePath("/companies");
  redirect("/companies");
}
