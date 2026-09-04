"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validators";

export type ActionState = { error?: string } | undefined;

function parseContactForm(formData: FormData) {
  return contactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    title: formData.get("title"),
    companyId: formData.get("companyId"),
    notes: formData.get("notes"),
  });
}

export async function createContactAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseContactForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { companyId, email, phone, title, notes, ...rest } = parsed.data;

  const contact = await prisma.contact.create({
    data: {
      ...rest,
      email: email || null,
      phone: phone || null,
      title: title || null,
      notes: notes || null,
      companyId: companyId || null,
    },
  });

  revalidatePath("/contacts");
  redirect(`/contacts/${contact.id}`);
}

export async function updateContactAction(
  contactId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseContactForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { companyId, email, phone, title, notes, ...rest } = parsed.data;

  await prisma.contact.update({
    where: { id: contactId },
    data: {
      ...rest,
      email: email || null,
      phone: phone || null,
      title: title || null,
      notes: notes || null,
      companyId: companyId || null,
    },
  });

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
  redirect(`/contacts/${contactId}`);
}

export async function deleteContactAction(contactId: string) {
  await prisma.contact.delete({ where: { id: contactId } });
  revalidatePath("/contacts");
  redirect("/contacts");
}
