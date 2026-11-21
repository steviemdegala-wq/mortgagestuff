"use client";

import { useActionState, useState } from "react";
import type { TopClient } from "@/generated/prisma/client";
import { saveTopClient } from "./actions";

type PersonOption = { id: string; name: string; role: string | null };
type ClientDetails = TopClient & { contacts: { id: string }[] };

const inputStyle = "mt-1 w-full rounded border border-gray-200 px-3 py-2 text-sm text-black focus:border-gray-400 focus:outline-none";
const projectionInputs = [
  { id: "expectedDeals", label: "Expected deals", max: 100_000, step: 1 },
  { id: "averageDealSize", label: "Average deal size ($)", max: 1_000_000_000, step: 0.01 },
  { id: "commissionRate", label: "Commission rate (%)", max: 100, step: 0.001 },
  { id: "annualValueOverride", label: "Net annual value override ($)", max: 1_000_000_000, step: 0.01 },
] as const;

export function TopClientForm({ rank, client, people }: {
  rank: number;
  client: ClientDetails | null;
  people: PersonOption[];
}) {
  const [error, action, pending] = useActionState(saveTopClient.bind(null, rank), null);
  const [search, setSearch] = useState("");
  const [values, setValues] = useState({
    name: client?.name ?? "",
    industry: client?.industry ?? "",
    expectedDeals: String(client?.expectedDeals ?? ""),
    averageDealSize: String(client?.averageDealSize ?? ""),
    commissionRate: String(client?.commissionRate ?? ""),
    annualValueOverride: String(client?.annualValueOverride ?? ""),
  });
  const [contactIds, setContactIds] = useState(() => new Set(client?.contacts.map((contact) => contact.id)));
  const searchTerm = search.trim().toLowerCase();
  const matches = people.filter((person) => !contactIds.has(person.id) && person.name.toLowerCase().includes(searchTerm));

  function updateValue(key: keyof typeof values, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  function toggleContact(id: string) {
    setContactIds((previous) => {
      const updated = new Set(previous);
      if (updated.has(id)) updated.delete(id);
      else updated.add(id);
      return updated;
    });
  }

  return (
    <form action={action} className="space-y-5 rounded-lg border border-gray-200 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-gray-600">
          Client name
          <input name="name" required maxLength={150} value={values.name} onChange={(event) => updateValue("name", event.target.value)} className={inputStyle} />
        </label>
        <label className="text-sm text-gray-600">
          Industry
          <input name="industry" maxLength={150} value={values.industry} onChange={(event) => updateValue("industry", event.target.value)} className={inputStyle} />
        </label>
        {projectionInputs.map(({ id, label, max, step }) => (
          <label key={id} className="text-sm text-gray-600">
            {label}
            <input type="number" name={id} min={0} max={max} step={step} value={values[id]} onChange={(event) => updateValue(id, event.target.value)} className={inputStyle} />
            {id === "annualValueOverride" && <span className="mt-1 block text-xs text-gray-500">Leave blank to use gross volume × commission rate.</span>}
          </label>
        ))}
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-black">Linked CRM contacts</legend>
        <p className="mt-1 text-xs text-gray-500">Last Contacted uses the most recent contact date across the linked People records.</p>
        {people.filter((person) => contactIds.has(person.id)).map((person) => (
          <div key={person.id} className="mt-2 flex items-center justify-between gap-4 rounded border border-gray-200 px-3 py-2 text-sm">
            <input type="hidden" name="contactIds" value={person.id} />
            <span>{person.name}</span>
            <button type="button" onClick={() => toggleContact(person.id)} aria-label={`Unlink ${person.name}`} className="text-gray-500 hover:text-black">Unlink</button>
          </div>
        ))}
        <input
          type="search"
          aria-label="Search People by name"
          placeholder="Search People by name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={inputStyle}
        />
        {searchTerm && (
          <ul className="mt-1 max-h-48 divide-y divide-gray-100 overflow-y-auto rounded border border-gray-200">
            {matches.map((person) => (
              <li key={person.id}>
                <button
                  type="button"
                  onClick={() => { toggleContact(person.id); setSearch(""); }}
                  className="flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <span>{person.name}{person.role && <span className="ml-2 text-xs text-gray-500">{person.role}</span>}</span>
                  <span className="text-gray-500">Link</span>
                </button>
              </li>
            ))}
            {!matches.length && <li className="px-3 py-2 text-sm text-gray-500">No matching contacts.</li>}
          </ul>
        )}
      </fieldset>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-50">
          {pending ? "Saving…" : "Save client"}
        </button>
        {client && (
          <button
            type="submit"
            name="intent"
            value="remove"
            formNoValidate
            disabled={pending}
            onClick={(event) => {
              if (!window.confirm("Remove this client from the Top 10? Linked People records will be kept.")) event.preventDefault();
            }}
            className="text-sm text-gray-500 hover:text-black disabled:opacity-50"
          >
            Remove from Top 10
          </button>
        )}
      </div>
    </form>
  );
}
