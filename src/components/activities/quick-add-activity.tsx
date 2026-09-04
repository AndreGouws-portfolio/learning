"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { createActivityAction, type ActionState } from "@/lib/actions/activities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { activityTypes } from "@/lib/validators";

const typeLabels: Record<(typeof activityTypes)[number], string> = {
  TASK: "To-do",
  CALL: "Call",
  EMAIL: "Email",
  MEETING: "Meeting",
  NOTE: "Note",
};

export function QuickAddActivity({
  contactId,
  dealId,
  companyId,
  defaultOpen = false,
  triggerLabel = "Log activity",
}: {
  contactId?: string;
  dealId?: string;
  companyId?: string;
  defaultOpen?: boolean;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const wrappedAction = async (_state: ActionState, formData: FormData) => {
    const result = await createActivityAction(_state, formData);
    if (!result?.error) setOpen(false);
    return result;
  };
  const [state, formAction] = useActionState(wrappedAction, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log an activity</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {contactId && <input type="hidden" name="contactId" value={contactId} />}
          {dealId && <input type="hidden" name="dealId" value={dealId} />}
          {companyId && <input type="hidden" name="companyId" value={companyId} />}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="type">Type</Label>
              <Select id="type" name="type" defaultValue="TASK">
                {activityTypes.map((type) => (
                  <option key={type} value={type}>
                    {typeLabels[type]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Follow up call" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <div className="flex justify-end">
            <SubmitButton pendingText="Saving…">Save</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
