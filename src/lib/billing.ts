export type PaymentStatus = "PAID" | "OVERDUE" | "UPCOMING";

/** Current billing period as "YYYY-MM", in the server's local time zone. */
export function currentPeriod(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function formatPeriod(period: string): string {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/**
 * A client is overdue once we're past their due day in the current period
 * and they have no payment recorded for it; before the due day it's upcoming.
 */
export function statusForClient(
  dueDay: number,
  hasPaymentForCurrentPeriod: boolean,
  now: Date = new Date(),
): PaymentStatus {
  if (hasPaymentForCurrentPeriod) return "PAID";
  return now.getDate() >= dueDay ? "OVERDUE" : "UPCOMING";
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
