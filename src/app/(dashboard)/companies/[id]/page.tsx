import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Globe, Phone, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityTimeline } from "@/components/activities/activity-timeline";
import { QuickAddActivity } from "@/components/activities/quick-add-activity";
import { DeleteButton } from "@/components/delete-button";
import { deleteCompanyAction } from "@/lib/actions/companies";
import { formatCurrency, formatDate } from "@/lib/utils";

const stageVariant = {
  LEAD: "secondary",
  QUALIFIED: "blue",
  PROPOSAL: "purple",
  NEGOTIATION: "amber",
  WON: "green",
  LOST: "red",
} as const;

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { lastName: "asc" } },
      deals: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!company) notFound();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <PageHeader
          title={company.name}
          description={company.industry ?? undefined}
          actions={
            <>
              <Button asChild size="sm" variant="outline">
                <Link href={`/companies/${company.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <DeleteButton
                action={deleteCompanyAction.bind(null, company.id)}
                confirmMessage="Delete this company? Linked contacts and deals will be kept, unlinked."
              />
            </>
          }
        />

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Activity</CardTitle>
            <QuickAddActivity companyId={company.id} />
          </CardHeader>
          <CardContent>
            <ActivityTimeline activities={company.activities} />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col gap-2 pt-6 text-sm">
            {company.website && (
              <div className="flex items-center gap-2 text-neutral-600">
                <Globe className="h-4 w-4 text-neutral-400" />
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {company.website}
                </a>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2 text-neutral-600">
                <Phone className="h-4 w-4 text-neutral-400" />
                <a href={`tel:${company.phone}`} className="hover:underline">
                  {company.phone}
                </a>
              </div>
            )}
            {company.address && (
              <div className="flex items-center gap-2 text-neutral-600">
                <MapPin className="h-4 w-4 text-neutral-400" />
                {company.address}
              </div>
            )}
            {company.notes && (
              <p className="whitespace-pre-wrap border-t border-neutral-100 pt-3 text-neutral-600">
                {company.notes}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacts ({company.contacts.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {company.contacts.length === 0 ? (
              <p className="text-sm text-neutral-400">No contacts at this company.</p>
            ) : (
              company.contacts.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  className="rounded-md border border-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                >
                  {contact.firstName} {contact.lastName}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deals ({company.deals.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {company.deals.length === 0 ? (
              <p className="text-sm text-neutral-400">No deals linked to this company.</p>
            ) : (
              company.deals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.id}`}
                  className="flex items-center justify-between rounded-md border border-neutral-100 px-3 py-2 hover:bg-neutral-50"
                >
                  <div>
                    <div className="text-sm font-medium text-neutral-900">{deal.title}</div>
                    <div className="text-xs text-neutral-500">
                      {formatCurrency(deal.value)} · {formatDate(deal.expectedCloseDate)}
                    </div>
                  </div>
                  <Badge variant={stageVariant[deal.stage]}>{deal.stage}</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
