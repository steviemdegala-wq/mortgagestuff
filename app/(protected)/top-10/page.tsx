import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { latestContactDate, projectClient, summarizeTopClients, TOP_CLIENT_COUNT } from "@/lib/top-clients";

export const dynamic = "force-dynamic";

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const number = new Intl.NumberFormat("en-US");
const contactDate = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "America/Los_Angeles",
});

function currency(value: number | null | undefined) {
  return value == null ? "—" : dollars.format(value);
}

export default async function TopClientsPage() {
  const clients = await prisma.topClient.findMany({
    include: {
      contacts: {
        select: { id: true, name: true, lastContactedAt: true },
        orderBy: { name: "asc" },
      },
    },
  });
  const rows = clients.map((client) => ({ ...client, ...projectClient(client) }));
  const byRank = new Map(rows.map((row) => [row.rank, row]));
  const totals = summarizeTopClients(rows);
  const metrics = [
    ["Gross volume", currency(totals.grossVolume)],
    ["Net annual value", currency(totals.annualValue)],
    ["Average client value", currency(totals.averageClientValue)],
    ["Expected deals", number.format(totals.expectedDeals)],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-black">Top 10 Clients</h1>
        <p className="mt-0.5 text-sm text-gray-400">Annual deal projections and contact history for your priority clients.</p>
      </div>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-gray-200 p-4">
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</dt>
            <dd className="mt-2 text-xl font-semibold tabular-nums text-black">{value}</dd>
          </div>
        ))}
      </dl>

      <div role="region" aria-label="Ranked clients" tabIndex={0} className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
            <tr>
              {["Rank", "Client name", "Industry", "Expected deals", "Average deal size", "Gross volume", "Commission rate", "Net annual client value", "Last contacted"].map((label, index) => (
                <th key={label} scope="col" className={`px-3 py-3 font-medium ${index >= 3 && index <= 7 ? "text-right" : ""}`}>{label}</th>
              ))}
              <th scope="col" className="px-3 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: TOP_CLIENT_COUNT }, (_, index) => {
              const rank = index + 1;
              const client = byRank.get(rank);
              const lastContacted = latestContactDate(client?.contacts ?? []);

              return (
                <tr key={rank} className="text-gray-600 hover:bg-gray-50">
                  <td className="px-3 py-3 tabular-nums">{rank}</td>
                  <th scope="row" className="min-w-36 px-3 py-3 font-medium text-black">
                    {client?.name ?? <span className="font-normal text-gray-400">Open slot</span>}
                    {client && client.contacts.length > 0 && (
                      <ul className="mt-0.5 space-y-0.5 text-xs font-normal text-gray-500">
                        {client.contacts.map((person) => (
                          <li key={person.id}>
                            <Link href={`/people/${person.id}`} className="hover:text-black hover:underline underline-offset-2">{person.name}</Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </th>
                  <td className="px-3 py-3">{client?.industry ?? "—"}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{client?.expectedDeals ?? "—"}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{currency(client?.averageDealSize)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{currency(client?.grossVolume)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{client?.commissionRate == null ? "—" : `${number.format(client.commissionRate)}%`}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{currency(client?.annualValue)}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {lastContacted ? (
                      <time dateTime={lastContacted.toISOString()}>{contactDate.format(lastContacted)}</time>
                    ) : client?.contacts.length ? (
                      <span className="text-gray-500">Never</span>
                    ) : (
                      <span className="text-gray-500">{client ? "No linked contacts" : "—"}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <Link
                      href={`/top-10/${rank}`}
                      aria-label={client ? `Edit ${client.name}` : `Add client at rank ${rank}`}
                      className="text-gray-600 hover:text-black hover:underline underline-offset-2"
                    >
                      {client ? "Edit" : "Add client"}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t border-gray-200 bg-gray-50 font-medium text-black">
            <tr>
              <th scope="row" colSpan={3} className="px-3 py-3">Top 10 total</th>
              <td className="px-3 py-3 text-right tabular-nums">{number.format(totals.expectedDeals)}</td>
              <td />
              <td className="px-3 py-3 text-right tabular-nums">{currency(totals.grossVolume)}</td>
              <td />
              <td className="px-3 py-3 text-right tabular-nums">{currency(totals.annualValue)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
