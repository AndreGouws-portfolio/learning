import Link from "next/link";
import { Search, Users, Building2, DollarSign } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  const [contacts, companies, deals] = query
    ? await Promise.all([
        prisma.contact.findMany({
          where: {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 20,
        }),
        prisma.company.findMany({
          where: { name: { contains: query, mode: "insensitive" } },
          take: 20,
        }),
        prisma.deal.findMany({
          where: { title: { contains: query, mode: "insensitive" } },
          take: 20,
        }),
      ])
    : [[], [], []];

  const totalResults = contacts.length + companies.length + deals.length;

  return (
    <div>
      <PageHeader title="Search" description={query ? `Results for "${query}"` : "Search everything"} />

      {!query ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
          <Search className="mb-3 h-8 w-8 text-neutral-300" />
          <p className="text-sm text-neutral-500">
            Use the search bar above to find contacts, companies, and deals.
          </p>
        </div>
      ) : totalResults === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
          <p className="text-sm text-neutral-500">No results found for &quot;{query}&quot;.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {contacts.length > 0 && (
            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <Users className="h-4 w-4 text-neutral-400" />
                <CardTitle>Contacts ({contacts.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {contacts.map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/contacts/${contact.id}`}
                    className="rounded-md px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    <span className="font-medium text-neutral-900">
                      {contact.firstName} {contact.lastName}
                    </span>
                    {contact.email && (
                      <span className="ml-2 text-neutral-500">{contact.email}</span>
                    )}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {companies.length > 0 && (
            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <Building2 className="h-4 w-4 text-neutral-400" />
                <CardTitle>Companies ({companies.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {companies.map((company) => (
                  <Link
                    key={company.id}
                    href={`/companies/${company.id}`}
                    className="rounded-md px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                  >
                    {company.name}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {deals.length > 0 && (
            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <DollarSign className="h-4 w-4 text-neutral-400" />
                <CardTitle>Deals ({deals.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    <span className="font-medium text-neutral-900">{deal.title}</span>
                    <span className="text-neutral-500">{formatCurrency(deal.value)}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
