import Link from "next/link";
import { Plus, DollarSign } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/deals/kanban-board";
import { formatCurrency } from "@/lib/utils";

export default async function DealsPage() {
  const deals = await prisma.deal.findMany({
    include: {
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const openValue = deals
    .filter((d) => d.stage !== "WON" && d.stage !== "LOST")
    .reduce((sum, d) => sum + d.value, 0);

  return (
    <div>
      <PageHeader
        title="Deals"
        description={`${deals.length} deal${deals.length === 1 ? "" : "s"} · ${formatCurrency(
          openValue
        )} open pipeline`}
        actions={
          <Button asChild size="sm">
            <Link href="/deals/new">
              <Plus className="h-4 w-4" />
              New deal
            </Link>
          </Button>
        }
      />

      {deals.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No deals yet"
          description="Create your first deal to start tracking the pipeline."
          actionLabel="New deal"
          actionHref="/deals/new"
        />
      ) : (
        <KanbanBoard deals={deals} />
      )}
    </div>
  );
}
