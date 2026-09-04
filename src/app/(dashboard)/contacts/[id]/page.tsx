import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Mail, Phone, Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityTimeline } from "@/components/activities/activity-timeline";
import { QuickAddActivity } from "@/components/activities/quick-add-activity";
import { DeleteButton } from "@/components/delete-button";
import { deleteContactAction } from "@/lib/actions/contacts";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const stageVariant = {
  LEAD: "secondary",
  QUALIFIED: "blue",
  PROPOSAL: "purple",
  NEGOTIATION: "amber",
  WON: "green",
  LOST: "red",
} as const;

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      company: true,
      deals: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!contact) notFound();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <PageHeader
          title={`${contact.firstName} ${contact.lastName}`}
          description={contact.title ?? undefined}
          actions={
            <>
              <Button asChild size="sm" variant="outline">
                <Link href={`/contacts/${contact.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <DeleteButton
                action={deleteContactAction.bind(null, contact.id)}
                confirmMessage="Delete this contact? This cannot be undone."
              />
            </>
          }
        />

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Activity</CardTitle>
            <QuickAddActivity contactId={contact.id} />
          </CardHeader>
          <CardContent>
            <ActivityTimeline activities={contact.activities} />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-base">
                {initials(`${contact.firstName} ${contact.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-neutral-900">
                {contact.firstName} {contact.lastName}
              </div>
              {contact.title && <div className="text-sm text-neutral-500">{contact.title}</div>}
            </div>

            <div className="flex w-full flex-col gap-2 pt-2 text-left text-sm">
              {contact.email && (
                <div className="flex items-center gap-2 text-neutral-600">
                  <Mail className="h-4 w-4 text-neutral-400" />
                  <a href={`mailto:${contact.email}`} className="hover:underline">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-neutral-600">
                  <Phone className="h-4 w-4 text-neutral-400" />
                  <a href={`tel:${contact.phone}`} className="hover:underline">
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.company && (
                <div className="flex items-center gap-2 text-neutral-600">
                  <Building2 className="h-4 w-4 text-neutral-400" />
                  <Link href={`/companies/${contact.company.id}`} className="hover:underline">
                    {contact.company.name}
                  </Link>
                </div>
              )}
            </div>

            {contact.notes && (
              <p className="w-full whitespace-pre-wrap border-t border-neutral-100 pt-3 text-left text-sm text-neutral-600">
                {contact.notes}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deals ({contact.deals.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {contact.deals.length === 0 ? (
              <p className="text-sm text-neutral-400">No deals linked to this contact.</p>
            ) : (
              contact.deals.map((deal) => (
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
