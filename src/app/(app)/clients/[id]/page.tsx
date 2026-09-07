import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentPeriod, formatMoney, formatPeriod, statusForClient } from "@/lib/billing";
import { StatusBadge } from "@/components/StatusBadge";
import { deactivateClient, deleteClient, markClientPaid, reactivateClient, sendClientReminder } from "../actions";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { id } = await params;
  const { message } = await searchParams;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      payments: { orderBy: { period: "desc" } },
      reminders: { orderBy: { sentAt: "desc" } },
    },
  });
  if (!client) notFound();

  const period = currentPeriod();
  const paidThisPeriod = client.payments.some((p) => p.period === period);
  const status = statusForClient(client.dueDay, paidThisPeriod);

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{client.name}</h1>
          <p className="text-sm text-zinc-500">{client.email}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {message && (
        <div className="mt-4 rounded-md bg-zinc-100 px-4 py-2 text-sm text-zinc-700">{message}</div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-white p-6 text-sm sm:grid-cols-3">
        <div>
          <div className="text-zinc-500">Service</div>
          <div className="font-medium text-zinc-900">{client.service ?? "—"}</div>
        </div>
        <div>
          <div className="text-zinc-500">Amount</div>
          <div className="font-medium text-zinc-900">{formatMoney(client.amount, client.currency)}</div>
        </div>
        <div>
          <div className="text-zinc-500">Due day</div>
          <div className="font-medium text-zinc-900">{client.dueDay}</div>
        </div>
        {client.notes && (
          <div className="col-span-full">
            <div className="text-zinc-500">Notes</div>
            <div className="font-medium text-zinc-900 whitespace-pre-wrap">{client.notes}</div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {status !== "PAID" && (
          <form action={markClientPaid}>
            <input type="hidden" name="id" value={client.id} />
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Mark paid for {formatPeriod(period)}
            </button>
          </form>
        )}
        {status === "OVERDUE" && (
          <form action={sendClientReminder}>
            <input type="hidden" name="id" value={client.id} />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Send reminder
            </button>
          </form>
        )}
        <Link
          href={`/clients/${client.id}/edit`}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Edit
        </Link>
        {client.active ? (
          <form action={deactivateClient}>
            <input type="hidden" name="id" value={client.id} />
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Deactivate
            </button>
          </form>
        ) : (
          <form action={reactivateClient}>
            <input type="hidden" name="id" value={client.id} />
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Reactivate
            </button>
          </form>
        )}
        <form action={deleteClient}>
          <input type="hidden" name="id" value={client.id} />
          <button
            type="submit"
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </form>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-zinc-900">Payment history</h2>
      {client.payments.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">No payments recorded yet.</p>
      ) : (
        <table className="mt-3 w-full rounded-lg border border-zinc-200 bg-white text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2">Period</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Paid at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {client.payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-2">{formatPeriod(payment.period)}</td>
                <td className="px-4 py-2">{formatMoney(payment.amount, client.currency)}</td>
                <td className="px-4 py-2">{payment.paidAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="mt-10 text-lg font-semibold text-zinc-900">Reminder history</h2>
      {client.reminders.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">No reminders sent yet.</p>
      ) : (
        <table className="mt-3 w-full rounded-lg border border-zinc-200 bg-white text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2">Period</th>
              <th className="px-4 py-2">Sent at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {client.reminders.map((reminder) => (
              <tr key={reminder.id}>
                <td className="px-4 py-2">{formatPeriod(reminder.period)}</td>
                <td className="px-4 py-2">{reminder.sentAt.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
