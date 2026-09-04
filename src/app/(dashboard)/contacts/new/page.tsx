import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "@/components/contacts/contact-form";
import { createContactAction } from "@/lib/actions/contacts";

export default async function NewContactPage() {
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-2xl">
      <PageHeader title="New contact" />
      <Card>
        <CardContent className="pt-5">
          <ContactForm action={createContactAction} companies={companies} />
        </CardContent>
      </Card>
    </div>
  );
}
