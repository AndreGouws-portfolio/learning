import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentPeriod, formatMoney, formatPeriod, statusForClient } from "@/lib/billing";
import { StatusBadge } from "@/components/StatusBadge";
import { markPaid, sendAllOverdueReminders, sendReminder } from "./actions";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const period = currentPeriod();

  const clients = await prisma.client.findMany({
    where: { active: true },
    include: { payments: { where: { period } } },
    orderBy: { name: "asc" },
  });

  const rows = clients
    .map((client) => ({
      ...client,
      status: statusForClient(client.dueDay, client.payments.length > 0),
    }))
    .sort((a, b) => {
      const order = { OVERDUE: 0, UPCOMING: 1, PAID: 2 } as const;
      return order[a.status] - order[b.status] || a.name.localeCompare(b.name);
    });

  const overdueCount = rows.filter((r) => r.status === "OVERDUE").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">Billing period: {formatPeriod(period)}</p>
        </div>
        {overdueCount > 0 && (
          <form action={sendAllOverdueReminders}>
            <button
              type="submit"
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Remind all overdue ({overdueCount})
            </button>
          </form>
        )}
      </div>

      {message && (
        <div className="mt-4 rounded-md bg-zinc-100 px-4 py-2 text-sm text-zinc-700">{message}</div>
      )}

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-zinc-300 p-10 text-center">
          <p className="text-zinc-500">No clients yet.</p>
          <Link
            href="/clients/new"
            className="mt-3 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Add your first client
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Due day</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((client) => (
                <tr key={client.id}>
                  <td className="px-4 py-3">
                    <Link href={`/clients/${client.id}`} className="font-medium text-zinc-900 hover:underline">
                      {client.name}
                    </Link>
                    {client.service && <div className="text-xs text-zinc-500">{client.service}</div>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatMoney(client.amount, client.currency)}</td>
                  <td className="px-4 py-3">{client.dueDay}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={client.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {client.status !== "PAID" && (
                        <form action={markPaid}>
                          <input type="hidden" name="clientId" value={client.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            Mark paid
                          </button>
                        </form>
                      )}
                      {client.status === "OVERDUE" && (
                        <form action={sendReminder}>
                          <input type="hidden" name="clientId" value={client.id} />
                          <button
                            type="submit"
                            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                          >
                            Send reminder
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
