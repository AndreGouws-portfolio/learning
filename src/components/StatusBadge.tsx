import type { PaymentStatus } from "@/lib/billing";

const STYLES: Record<PaymentStatus, string> = {
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  UPCOMING: "bg-amber-100 text-amber-800",
};

const LABELS: Record<PaymentStatus, string> = {
  PAID: "Paid",
  OVERDUE: "Overdue",
  UPCOMING: "Upcoming",
};

export function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
