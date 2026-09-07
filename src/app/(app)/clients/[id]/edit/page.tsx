import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientForm } from "@/components/ClientForm";
import { updateClient } from "../../actions";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-zinc-900">Edit {client.name}</h1>
      <div className="mt-6">
        <ClientForm action={updateClient} defaultValues={client} submitLabel="Save changes" />
      </div>
    </div>
  );
}
