"use client";

import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { updateDealStageAction } from "@/lib/actions/deals";
import { dealStages } from "@/lib/validators";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";

export type KanbanDeal = {
  id: string;
  title: string;
  value: number;
  stage: (typeof dealStages)[number];
  company: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string } | null;
};

const stageLabels: Record<(typeof dealStages)[number], string> = {
  LEAD: "Lead",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

const stageAccent: Record<(typeof dealStages)[number], string> = {
  LEAD: "border-t-neutral-400",
  QUALIFIED: "border-t-blue-400",
  PROPOSAL: "border-t-purple-400",
  NEGOTIATION: "border-t-amber-400",
  WON: "border-t-emerald-400",
  LOST: "border-t-red-400",
};

function DealCardBody({ deal, isDragging }: { deal: KanbanDeal; isDragging?: boolean }) {
  return (
    <>
      <Link
        href={`/deals/${deal.id}`}
        onClick={(e) => isDragging && e.preventDefault()}
        className="text-sm font-medium text-neutral-900 hover:underline"
      >
        {deal.title}
      </Link>
      <div className="mt-1 text-sm font-semibold text-neutral-700">
        {formatCurrency(deal.value)}
      </div>
      {(deal.company || deal.contact) && (
        <div className="mt-1 truncate text-xs text-neutral-500">
          {deal.company?.name}
          {deal.company && deal.contact && " · "}
          {deal.contact && `${deal.contact.firstName} ${deal.contact.lastName}`}
        </div>
      )}
    </>
  );
}

function DealCard({ deal }: { deal: KanbanDeal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab touch-none rounded-md border border-neutral-200 bg-white p-3 shadow-sm active:cursor-grabbing",
        isDragging && "z-10 opacity-70 shadow-md"
      )}
    >
      <DealCardBody deal={deal} isDragging={isDragging} />
    </div>
  );
}

function KanbanColumn({
  stage,
  deals,
  interactive,
}: {
  stage: (typeof dealStages)[number];
  deals: KanbanDeal[];
  interactive: boolean;
}) {
  const total = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <ColumnShell stage={stage} count={deals.length} total={total} interactive={interactive}>
      {deals.map((deal) =>
        interactive ? (
          <DealCard key={deal.id} deal={deal} />
        ) : (
          <div
            key={deal.id}
            className="rounded-md border border-neutral-200 bg-white p-3 shadow-sm"
          >
            <DealCardBody deal={deal} />
          </div>
        )
      )}
    </ColumnShell>
  );
}

function ColumnShell({
  stage,
  count,
  total,
  interactive,
  children,
}: {
  stage: (typeof dealStages)[number];
  count: number;
  total: number;
  interactive: boolean;
  children: React.ReactNode;
}) {
  if (interactive) {
    return <DroppableColumnShell stage={stage} count={count} total={total}>{children}</DroppableColumnShell>;
  }

  return (
    <div
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border border-t-4 border-neutral-200 bg-neutral-50",
        stageAccent[stage]
      )}
    >
      <ColumnHeader stage={stage} count={count} total={total} />
      <div className="flex flex-1 flex-col gap-2 px-2 pb-3">{children}</div>
    </div>
  );
}

function DroppableColumnShell({
  stage,
  count,
  total,
  children,
}: {
  stage: (typeof dealStages)[number];
  count: number;
  total: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border border-t-4 border-neutral-200 bg-neutral-50",
        stageAccent[stage],
        isOver && "bg-neutral-100 ring-2 ring-neutral-300"
      )}
    >
      <ColumnHeader stage={stage} count={count} total={total} />
      <div className="flex flex-1 flex-col gap-2 px-2 pb-3">{children}</div>
    </div>
  );
}

function ColumnHeader({
  stage,
  count,
  total,
}: {
  stage: (typeof dealStages)[number];
  count: number;
  total: number;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-neutral-900">{stageLabels[stage]}</span>
        <Badge variant="secondary">{count}</Badge>
      </div>
      <span className="text-xs text-neutral-500">{formatCurrency(total)}</span>
    </div>
  );
}

const emptySubscribe = () => () => {};

export function KanbanBoard({ deals }: { deals: KanbanDeal[] }) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [localDeals, setLocalDeals] = useState(deals);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const grouped = useMemo(() => {
    const map = new Map<string, KanbanDeal[]>(dealStages.map((s) => [s, []]));
    for (const deal of localDeals) map.get(deal.stage)?.push(deal);
    return map;
  }, [localDeals]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const newStage = over.id as (typeof dealStages)[number];
    const dealId = active.id as string;
    const current = localDeals.find((d) => d.id === dealId);
    if (!current || current.stage === newStage) return;

    setLocalDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );
    startTransition(() => {
      updateDealStageAction(dealId, newStage);
    });
  }

  const columns = dealStages.map((stage) => (
    <KanbanColumn
      key={stage}
      stage={stage}
      deals={grouped.get(stage) ?? []}
      interactive={mounted}
    />
  ));

  if (!mounted) {
    return <div className="flex gap-4 overflow-x-auto pb-4">{columns}</div>;
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">{columns}</div>
    </DndContext>
  );
}
