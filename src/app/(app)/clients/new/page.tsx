import { ClientForm } from "@/components/ClientForm";
import { createClient } from "../actions";

export default function NewClientPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-zinc-900">Add client</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Enter the details from the client&apos;s email so you can track their monthly payment.
      </p>
      <div className="mt-6">
        <ClientForm action={createClient} submitLabel="Add client" />
      </div>
    </div>
  );
}
