import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyForm } from "@/components/companies/company-form";
import { updateCompanyAction } from "@/lib/actions/companies";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) notFound();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Edit company" />
      <Card>
        <CardContent className="pt-5">
          <CompanyForm action={updateCompanyAction.bind(null, company.id)} company={company} />
        </CardContent>
      </Card>
    </div>
  );
}
