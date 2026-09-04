import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  title: z.string().optional().or(z.literal("")),
  companyId: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z.string().optional().or(z.literal("")),
  industry: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const dealStages = [
  "LEAD",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export const dealSchema = z.object({
  title: z.string().min(1, "Deal title is required"),
  value: z.coerce.number().min(0, "Value must be positive"),
  stage: z.enum(dealStages),
  companyId: z.string().optional().or(z.literal("")),
  contactId: z.string().optional().or(z.literal("")),
  expectedCloseDate: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const activityTypes = ["TASK", "CALL", "EMAIL", "MEETING", "NOTE"] as const;

export const activitySchema = z.object({
  type: z.enum(activityTypes),
  title: z.string().min(1, "Title is required"),
  notes: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  contactId: z.string().optional().or(z.literal("")),
  dealId: z.string().optional().or(z.literal("")),
  companyId: z.string().optional().or(z.literal("")),
});
