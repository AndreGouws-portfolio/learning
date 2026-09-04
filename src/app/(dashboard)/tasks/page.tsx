import { CheckSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTimeline } from "@/components/activities/activity-timeline";
import { QuickAddActivity } from "@/components/activities/quick-add-activity";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: openNew } = await searchParams;

  const tasks = await prisma.activity.findMany({
    where: { type: "TASK" },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true } },
      deal: { select: { id: true, title: true } },
      company: { select: { id: true, name: true } },
    },
  });

  const pending = tasks
    .filter((t) => !t.completedAt)
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const completed = tasks
    .filter((t) => t.completedAt)
    .sort(
      (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    )
    .slice(0, 20);

  return (
    <div>
      <PageHeader
        title="Tasks"
        description={`${pending.length} open task${pending.length === 1 ? "" : "s"}`}
        actions={<QuickAddActivity defaultOpen={openNew === "1"} triggerLabel="New task" />}
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Create a task to keep track of follow-ups and to-dos."
          actionLabel="New task"
          actionHref="/tasks?new=1"
        />
      ) : (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Open ({pending.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline activities={pending} showContext />
            </CardContent>
          </Card>

          {completed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recently completed</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityTimeline activities={completed} showContext />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
