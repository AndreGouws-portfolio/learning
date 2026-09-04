import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DealForm } from "@/components/deals/deal-form";
import { createDealAction } from "@/lib/actions/deals";

export default async function NewDealPage() {
  const [companies, contacts] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.contact.findMany({
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  return (
    <div className="max-w-2xl">
      <PageHeader title="New deal" />
      <Card>
        <CardContent className="pt-5">
          <DealForm action={createDealAction} companies={companies} contacts={contacts} />
        </CardContent>
      </Card>
    </div>
  );
}
