import Link from "next/link";
import { Plus, Users } from "lucide-react";
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

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const contacts = await prisma.contact.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { company: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Contacts"
        description={`${contacts.length} contact${contacts.length === 1 ? "" : "s"}`}
        actions={
          <Button asChild size="sm">
            <Link href="/contacts/new">
              <Plus className="h-4 w-4" />
              New contact
            </Link>
          </Button>
        }
      />

      <form className="mb-4 max-w-xs">
        <Input type="search" name="q" placeholder="Filter by name or email…" defaultValue={q} />
      </form>

      {contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Add your first contact to start building your address book."
          actionLabel="New contact"
          actionHref="/contacts/new"
        />
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="font-medium text-neutral-900 hover:underline"
                    >
                      {contact.firstName} {contact.lastName}
                    </Link>
                    {contact.title && (
                      <div className="text-xs text-neutral-500">{contact.title}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.company ? (
                      <Link
                        href={`/companies/${contact.company.id}`}
                        className="text-neutral-600 hover:underline"
                      >
                        {contact.company.name}
                      </Link>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-neutral-600">{contact.email || "—"}</TableCell>
                  <TableCell className="text-neutral-600">{contact.phone || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
