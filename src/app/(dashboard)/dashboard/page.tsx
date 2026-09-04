import Link from "next/link";
import { Users, Building2, DollarSign, CheckSquare, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { PipelineChart } from "@/components/dashboard/pipeline-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTimeline } from "@/components/activities/activity-timeline";
import { dealStages } from "@/lib/validators";
import { formatCurrency } from "@/lib/utils";

const stageLabels: Record<(typeof dealStages)[number], string> = {
  LEAD: "Lead",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export default async function DashboardPage() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [contactCount, companyCount, deals, openTaskCount, recentActivity] = await Promise.all([
    prisma.contact.count(),
    prisma.company.count(),
    prisma.deal.findMany({ select: { value: true, stage: true } }),
    prisma.activity.count({ where: { type: "TASK", completedAt: null } }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, title: true } },
        company: { select: { id: true, name: true } },
      },
    }),
  ]);

  const openValue = deals
    .filter((d) => d.stage !== "WON" && d.stage !== "LOST")
    .reduce((sum, d) => sum + d.value, 0);

  const wonValue = deals
    .filter((d) => d.stage === "WON")
    .reduce((sum, d) => sum + d.value, 0);

  const pipelineData = dealStages
    .filter((s) => s !== "WON" && s !== "LOST")
    .map((stage) => ({
      stage: stageLabels[stage],
      value: deals.filter((d) => d.stage === stage).reduce((sum, d) => sum + d.value, 0),
    }));

  const upcomingTasks = await prisma.activity.findMany({
    where: { type: "TASK", completedAt: null },
    orderBy: { dueDate: "asc" },
    take: 6,
    include: {
      contact: { select: { id: true, firstName: true, lastName: true } },
      deal: { select: { id: true, title: true } },
      company: { select: { id: true, name: true } },
    },
  });

  return (
    <div>
      <PageHeader title="Dashboard" description="Your pipeline at a glance" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Contacts" value={String(contactCount)} icon={Users} />
        <StatCard label="Companies" value={String(companyCount)} icon={Building2} />
        <StatCard label="Open pipeline" value={formatCurrency(openValue)} icon={DollarSign} />
        <StatCard label="Open tasks" value={String(openTaskCount)} icon={CheckSquare} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Pipeline by stage</CardTitle>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" />
              {formatCurrency(wonValue)} won
            </div>
          </CardHeader>
          <CardContent>
            <PipelineChart data={pipelineData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">
                No open tasks. You&apos;re all caught up.
              </p>
            ) : (
              <ActivityTimeline activities={upcomingTasks} showContext />
            )}
            <Link
              href="/tasks"
              className="mt-2 block text-center text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:underline"
            >
              View all tasks
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline activities={recentActivity} showContext />
        </CardContent>
      </Card>
    </div>
  );
}
