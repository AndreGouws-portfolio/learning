"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Phone,
  Mail,
  Users as MeetingIcon,
  StickyNote,
  Square,
  CheckSquare2,
  Trash2,
} from "lucide-react";
import { toggleActivityCompleteAction, deleteActivityAction } from "@/lib/actions/activities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";

export type TimelineActivity = {
  id: string;
  type: "TASK" | "CALL" | "EMAIL" | "MEETING" | "NOTE";
  title: string;
  notes: string | null;
  dueDate: Date | string | null;
  completedAt: Date | string | null;
  createdAt: Date | string;
  contact?: { id: string; firstName: string; lastName: string } | null;
  deal?: { id: string; title: string } | null;
  company?: { id: string; name: string } | null;
};

const typeIcons = {
  TASK: CheckSquare,
  CALL: Phone,
  EMAIL: Mail,
  MEETING: MeetingIcon,
  NOTE: StickyNote,
};

export function ActivityTimeline({
  activities,
  showContext = false,
}: {
  activities: TimelineActivity[];
  showContext?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (activities.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-400">No activity yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-neutral-100">
      {activities.map((activity) => {
        const Icon = typeIcons[activity.type];
        const completed = Boolean(activity.completedAt);
        const overdue =
          activity.type === "TASK" &&
          !completed &&
          activity.dueDate &&
          new Date(activity.dueDate) < new Date(new Date().toDateString());

        return (
          <li key={activity.id} className="flex items-start gap-3 py-3">
            {activity.type === "TASK" ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => {
                    toggleActivityCompleteAction(activity.id, !completed);
                  })
                }
                className="mt-0.5 shrink-0 text-neutral-400 hover:text-neutral-900"
                aria-label={completed ? "Mark as not done" : "Mark as done"}
              >
                {completed ? (
                  <CheckSquare2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-neutral-400">
                <Icon className="h-4 w-4" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium text-neutral-900",
                    completed && "text-neutral-400 line-through"
                  )}
                >
                  {activity.title}
                </span>
                {activity.dueDate && activity.type === "TASK" && !completed && (
                  <Badge variant={overdue ? "red" : "secondary"}>
                    Due {formatDate(activity.dueDate)}
                  </Badge>
                )}
              </div>
              {activity.notes && (
                <p className="mt-0.5 text-sm text-neutral-500">{activity.notes}</p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                <span>{formatDate(activity.createdAt)}</span>
                {showContext && activity.contact && (
                  <Link href={`/contacts/${activity.contact.id}`} className="hover:underline">
                    {activity.contact.firstName} {activity.contact.lastName}
                  </Link>
                )}
                {showContext && activity.deal && (
                  <Link href={`/deals/${activity.deal.id}`} className="hover:underline">
                    {activity.deal.title}
                  </Link>
                )}
                {showContext && activity.company && (
                  <Link href={`/companies/${activity.company.id}`} className="hover:underline">
                    {activity.company.name}
                  </Link>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-neutral-400 hover:text-red-600"
              onClick={() =>
                startTransition(() => {
                  deleteActivityAction(activity.id);
                })
              }
              aria-label="Delete activity"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
