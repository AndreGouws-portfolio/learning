"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import type { ActionState } from "@/lib/actions/companies";

type Company = {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
};

export function CompanyForm({
  action,
  company,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  company?: Company;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="name">Company name</Label>
          <Input id="name" name="name" required defaultValue={company?.name} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            placeholder="https://example.com"
            defaultValue={company?.website ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" name="industry" defaultValue={company?.industry ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={company?.phone ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" defaultValue={company?.address ?? ""} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={company?.notes ?? ""} />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <SubmitButton pendingText="Saving…">
          {company ? "Save changes" : "Create company"}
        </SubmitButton>
      </div>
    </form>
  );
}
