import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const companies = await prisma.company.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    include: { _count: { select: { contacts: true, deals: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Companies"
        description={`${companies.length} compan${companies.length === 1 ? "y" : "ies"}`}
        actions={
          <Button asChild size="sm">
            <Link href="/companies/new">
              <Plus className="h-4 w-4" />
              New company
            </Link>
          </Button>
        }
      />

      <form className="mb-4 max-w-xs">
        <Input type="search" name="q" placeholder="Filter by name…" defaultValue={q} />
      </form>

      {companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Add companies to organize contacts and deals by account."
          actionLabel="New company"
          actionHref="/companies/new"
        />
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Deals</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <Link
                      href={`/companies/${company.id}`}
                      className="font-medium text-neutral-900 hover:underline"
                    >
                      {company.name}
                    </Link>
                    {company.website && (
                      <div className="text-xs text-neutral-500">{company.website}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-neutral-600">{company.industry || "—"}</TableCell>
                  <TableCell className="text-neutral-600">{company._count.contacts}</TableCell>
                  <TableCell className="text-neutral-600">{company._count.deals}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
