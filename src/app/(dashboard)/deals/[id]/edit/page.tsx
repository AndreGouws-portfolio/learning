import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DealForm } from "@/components/deals/deal-form";
import { updateDealAction } from "@/lib/actions/deals";

export default async function EditDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [deal, companies, contacts] = await Promise.all([
    prisma.deal.findUnique({ where: { id } }),
    prisma.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.contact.findMany({
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  if (!deal) notFound();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Edit deal" />
      <Card>
        <CardContent className="pt-5">
          <DealForm
            action={updateDealAction.bind(null, deal.id)}
            deal={deal}
            companies={companies}
            contacts={contacts}
          />
        </CardContent>
      </Card>
    </div>
  );
}
