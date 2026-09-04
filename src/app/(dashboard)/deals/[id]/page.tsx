import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Building2, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityTimeline } from "@/components/activities/activity-timeline";
import { QuickAddActivity } from "@/components/activities/quick-add-activity";
import { DeleteButton } from "@/components/delete-button";
import { deleteDealAction } from "@/lib/actions/deals";
import { formatCurrency, formatDate } from "@/lib/utils";

const stageVariant = {
  LEAD: "secondary",
  QUALIFIED: "blue",
  PROPOSAL: "purple",
  NEGOTIATION: "amber",
  WON: "green",
  LOST: "red",
} as const;

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      company: true,
      contact: true,
      activities: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!deal) notFound();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <PageHeader
          title={deal.title}
          description={formatCurrency(deal.value)}
          actions={
            <>
              <Button asChild size="sm" variant="outline">
                <Link href={`/deals/${deal.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <DeleteButton
                action={deleteDealAction.bind(null, deal.id)}
                confirmMessage="Delete this deal? This cannot be undone."
              />
            </>
          }
        />

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Activity</CardTitle>
            <QuickAddActivity dealId={deal.id} />
          </CardHeader>
          <CardContent>
            <ActivityTimeline activities={deal.activities} />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Stage</span>
              <Badge variant={stageVariant[deal.stage]}>{deal.stage}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Value</span>
              <span className="font-medium text-neutral-900">
                {formatCurrency(deal.value)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Expected close</span>
              <span className="text-neutral-900">{formatDate(deal.expectedCloseDate)}</span>
            </div>
            {deal.closedAt && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Closed</span>
                <span className="text-neutral-900">{formatDate(deal.closedAt)}</span>
              </div>
            )}

            {(deal.company || deal.contact) && (
              <div className="flex flex-col gap-2 border-t border-neutral-100 pt-3">
                {deal.company && (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Building2 className="h-4 w-4 text-neutral-400" />
                    <Link href={`/companies/${deal.company.id}`} className="hover:underline">
                      {deal.company.name}
                    </Link>
                  </div>
                )}
                {deal.contact && (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <User className="h-4 w-4 text-neutral-400" />
                    <Link href={`/contacts/${deal.contact.id}`} className="hover:underline">
                      {deal.contact.firstName} {deal.contact.lastName}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {deal.notes && (
              <p className="whitespace-pre-wrap border-t border-neutral-100 pt-3 text-neutral-600">
                {deal.notes}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
