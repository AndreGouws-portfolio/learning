import nodemailer, { type Transporter } from "nodemailer";
import { formatMoney, formatPeriod } from "@/lib/billing";

export type ReminderClient = {
  name: string;
  email: string;
  service: string | null;
  amount: number;
  currency: string;
};

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in your .env file.",
    );
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true" || Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

function buildReminderEmail(client: ReminderClient, period: string) {
  const amount = formatMoney(client.amount, client.currency);
  const periodLabel = formatPeriod(period);
  const service = client.service ?? "your subscription";

  const subject = `Payment reminder: ${service} — ${amount} due`;
  const text = [
    `Hi ${client.name},`,
    "",
    `This is a friendly reminder that your payment of ${amount} for ${service} (${periodLabel}) hasn't come through yet.`,
    "",
    "If you've already sent it, thank you — please disregard this message.",
    "Otherwise, let me know if you have any questions.",
    "",
    "Thanks!",
  ].join("\n");

  return { subject, text };
}

export async function sendReminderEmail(client: ReminderClient, period: string) {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not set. Add it to your .env file.");
  }

  const { subject, text } = buildReminderEmail(client, period);
  await getTransporter().sendMail({
    from,
    to: client.email,
    subject,
    text,
  });
}
