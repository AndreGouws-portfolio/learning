"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";
import { dealStages } from "@/lib/validators";
import type { ActionState } from "@/lib/actions/deals";

type Deal = {
  id: string;
  title: string;
  value: number;
  stage: (typeof dealStages)[number];
  companyId: string | null;
  contactId: string | null;
  expectedCloseDate: Date | string | null;
  notes: string | null;
};

const stageLabels: Record<(typeof dealStages)[number], string> = {
  LEAD: "Lead",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export function DealForm({
  action,
  deal,
  companies,
  contacts,
  defaultStage,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  deal?: Deal;
  companies: { id: string; name: string }[];
  contacts: { id: string; firstName: string; lastName: string }[];
  defaultStage?: (typeof dealStages)[number];
}) {
  const [state, formAction] = useActionState(action, undefined);
  const expectedCloseDate = deal?.expectedCloseDate
    ? new Date(deal.expectedCloseDate).toISOString().slice(0, 10)
    : "";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="title">Deal title</Label>
          <Input id="title" name="title" required defaultValue={deal?.title} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="value">Value (USD)</Label>
          <Input
            id="value"
            name="value"
            type="number"
            min={0}
            step="0.01"
            defaultValue={deal?.value ?? 0}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stage">Stage</Label>
          <Select id="stage" name="stage" defaultValue={deal?.stage ?? defaultStage ?? "LEAD"}>
            {dealStages.map((stage) => (
              <option key={stage} value={stage}>
                {stageLabels[stage]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="companyId">Company</Label>
          <Select id="companyId" name="companyId" defaultValue={deal?.companyId ?? ""}>
            <option value="">No company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactId">Contact</Label>
          <Select id="contactId" name="contactId" defaultValue={deal?.contactId ?? ""}>
            <option value="">No contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.firstName} {contact.lastName}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expectedCloseDate">Expected close date</Label>
          <Input
            id="expectedCloseDate"
            name="expectedCloseDate"
            type="date"
            defaultValue={expectedCloseDate}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={deal?.notes ?? ""} />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <SubmitButton pendingText="Saving…">
          {deal ? "Save changes" : "Create deal"}
        </SubmitButton>
      </div>
    </form>
  );
}
