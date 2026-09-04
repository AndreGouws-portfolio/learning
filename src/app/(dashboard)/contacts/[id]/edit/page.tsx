import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "@/components/contacts/contact-form";
import { updateContactAction } from "@/lib/actions/contacts";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [contact, companies] = await Promise.all([
    prisma.contact.findUnique({ where: { id } }),
    prisma.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!contact) notFound();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Edit contact" />
      <Card>
        <CardContent className="pt-5">
          <ContactForm
            action={updateContactAction.bind(null, contact.id)}
            contact={contact}
            companies={companies}
          />
        </CardContent>
      </Card>
    </div>
  );
}
