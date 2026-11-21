import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TOP_CLIENT_COUNT } from "@/lib/top-clients";
import { TopClientForm } from "./top-client-form";

export const dynamic = "force-dynamic";

export default async function EditTopClientPage({ params }: { params: Promise<{ rank: string }> }) {
  const { rank: rankParam } = await params;
  const rank = Number(rankParam);
  if (!Number.isInteger(rank) || String(rank) !== rankParam || rank < 1 || rank > TOP_CLIENT_COUNT) notFound();

  const [client, people] = await Promise.all([
    prisma.topClient.findUnique({
      where: { rank },
      include: { contacts: { select: { id: true } } },
    }),
    prisma.person.findMany({
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/top-10" className="text-sm text-gray-500 hover:text-black hover:underline">Back to Top 10</Link>
      <div>
        <h1 className="text-lg font-semibold text-black">{client ? "Edit client" : "Add client"}</h1>
        <p className="mt-0.5 text-sm text-gray-500">Rank {rank} of {TOP_CLIENT_COUNT}</p>
      </div>
      <TopClientForm rank={rank} client={client} people={people} />
    </div>
  );
}
