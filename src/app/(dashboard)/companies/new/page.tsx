import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyForm } from "@/components/companies/company-form";
import { createCompanyAction } from "@/lib/actions/companies";

export default function NewCompanyPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="New company" />
      <Card>
        <CardContent className="pt-5">
          <CompanyForm action={createCompanyAction} />
        </CardContent>
      </Card>
    </div>
  );
}
