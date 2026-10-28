"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import PipelineValueChart from "@/components/PipelineValueChart";

const STAGES = [
  "New Lead",
  "Pre-Qualified",
  "Application",
  "Processing",
  "Underwriting",
  "Closing",
  "Funded",
];

interface Loan {
  stage: string | null;
  archivedAt: string | null;
  id: string;
  name: string;
  loanAmount: number;
  loanType: string;
  targetRate: number | null;
  pricingRate: number | null;
  expectedCloseDate: string | null;
  notes: string | null;
}

interface Person {
  id: string;
  name: string;
  stage: string | null;
  phone: string | null;
  role: string | null;
  Loan: Loan[];
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtRate(n: number | null) {
  if (n == null) return null;
  return `${n.toFixed(3)}%`;
}

function fmtDate(s: string | null) {
  if (!s) return null;
  return new Date(s.split("T")[0] + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PipelinePage() {
  const [contacts, setContacts] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const router = useRouter();
  const [view, setView] = useState<"active" | "archived">("active");
  const requestVersion = useRef(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function toggleLoans(ids: string[]) {
    setSelected((previous) => {
      const next = new Set(previous);
      const remove = ids.every((id) => next.has(id));
      ids.forEach((id) => remove ? next.delete(id) : next.add(id));
      return next;
    });
  }

  async function updateSelected(action: "archive" | "restore" | "delete") {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/pipeline", {
        method: action === "delete" ? "DELETE" : "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanIds: [...selected], action }),
      });
      if (!res.ok) throw new Error(`Could not ${action} the selected loans. Please try again.`);
      setSelected(new Set());
      setConfirmDelete(false);
      await fetchContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update loans.");
    } finally { setDeleting(false); }
  }

  const fetchContacts = useCallback(async () => {
    const version = ++requestVersion.current;
    const params = new URLSearchParams({ view });
    if (search) params.set("search", search);
    if (stageFilter) params.set("stage", stageFilter);
    try {
      const res = await fetch(`/api/pipeline?${params}`);
      if (!res.ok) throw new Error("Could not load pipeline. Please refresh and try again.");
      const data: Person[] = await res.json();
      if (version !== requestVersion.current) return;
      setContacts(data);
      const visible = new Set(data.flatMap((person) => person.Loan.map((loan) => loan.id)));
      setSelected((previous) => new Set([...previous].filter((id) => visible.has(id))));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load pipeline.");
    } finally { if (version === requestVersion.current) setLoading(false); }
  }, [search, stageFilter, view]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const totalValue = contacts.reduce((sum, c) => sum + c.Loan.reduce((s, l) => s + l.loanAmount, 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-black">Pipeline</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-sm text-gray-400">
              {contacts.length} {contacts.length === 1 ? "person" : "people"}
            </p>
            {totalValue > 0 && (
              <p className="text-sm text-gray-500 font-medium">
                &middot; {fmt(totalValue)} total
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2" aria-label="Pipeline view">
        {(["active", "archived"] as const).map((tab) => (
          <button key={tab} disabled={deleting} aria-pressed={view === tab}
            onClick={() => { setView(tab); setSelected(new Set()); setContacts([]); setLoading(true); setError(""); setConfirmDelete(false); }}
            className={`text-sm px-4 py-2 rounded ${view === tab ? "bg-black text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {tab === "active" ? "Active pipeline" : "Archived"}
          </button>
        ))}
      </div>
      {view === "archived" && <p className="text-sm text-gray-500">Archived loans are kept for your records and excluded from the active pipeline. Restore them anytime, or permanently delete them here.</p>}
      {view === "active" && <PipelineValueChart contacts={contacts} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name"
          className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 w-52"
        />
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 bg-white text-gray-700"
        >
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {!loading && contacts.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 border border-gray-200 rounded-lg p-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" disabled={deleting}
              checked={contacts.every((person) => person.Loan.every((loan) => selected.has(loan.id)))}
              onChange={() => toggleLoans(contacts.flatMap((person) => person.Loan.map((loan) => loan.id)))} />
            Select all visible loans
          </label>
          <span className="text-sm text-gray-400">{selected.size} selected</span>
          {selected.size > 0 && <>
            <button disabled={deleting} onClick={() => setSelected(new Set())} className="text-sm text-gray-500">Clear selection</button>
            {view === "active" ? (
              <button disabled={deleting} onClick={() => updateSelected("archive")} className="ml-auto text-sm border border-gray-200 rounded px-3 py-1.5">{deleting ? "Archiving..." : "Archive selected"}</button>
            ) : <>
              <button disabled={deleting} onClick={() => updateSelected("restore")} className="ml-auto text-sm border border-gray-200 rounded px-3 py-1.5">{deleting ? "Updating..." : "Restore selected"}</button>
              <button disabled={deleting} onClick={() => setConfirmDelete(true)} className="text-sm text-red-600 border border-red-200 rounded px-3 py-1.5">Permanently delete selected</button>
            </>}
          </>}
        </div>
      )}
      {confirmDelete && (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 id="delete-title" className="font-semibold">Permanently delete {selected.size} selected {selected.size === 1 ? "loan" : "loans"}?</h2>
            <p className="text-sm text-gray-500">The selected archived loans will be permanently deleted. This cannot be undone. People profiles, notes, and unselected loans will be kept.</p>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3">
              <button disabled={deleting} onClick={() => setConfirmDelete(false)} className="text-sm px-3 py-2">Cancel</button>
              <button disabled={deleting} onClick={() => updateSelected("delete")} className="text-sm px-3 py-2 rounded bg-red-600 text-white disabled:opacity-50">{deleting ? "Deleting..." : "Permanently delete"}</button>
            </div>
          </div>
        </div>
      )}
      {/* Cards */}
      {loading ? (
        <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
      ) : contacts.length === 0 ? (
        <div className="p-8 text-center border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-400">{view === "archived" ? "No archived loans." : "No active pipeline entries. Add a loan to a person to see them here."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => {
            const contactTotal = contact.Loan.reduce((s, l) => s + l.loanAmount, 0);
            return (
              <div
                key={contact.id}
                className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors cursor-pointer"
                onClick={() => router.push(`/people/${contact.id}`)}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" aria-label={`Select all loans for ${contact.name}`} disabled={deleting}
                      checked={contact.Loan.every((loan) => selected.has(loan.id))}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleLoans(contact.Loan.map((loan) => loan.id))} />
                    <div>
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/people/${contact.id}`); }} className="text-sm font-semibold text-black hover:underline">{contact.name}</button>
                    <div className="flex items-center gap-2 mt-0.5">
                      {contact.role && <p className="text-xs text-gray-400">{contact.role}</p>}

                    </div>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-black flex-shrink-0">{fmt(contactTotal)}</p>
                </div>

                <div className="space-y-2">
                  {contact.Loan.map((loan) => (
                    <div key={loan.id} className="flex items-start gap-3 pl-3 border-l-2 border-gray-100">
                      <input type="checkbox" aria-label={`Select ${loan.name}`} disabled={deleting}
                        checked={selected.has(loan.id)} onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleLoans([loan.id])} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-gray-800">{loan.name}</p>
                          <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                            {loan.loanType}
                          </span>
                          {loan.archivedAt && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Archived {fmtDate(loan.archivedAt)}</span>}
                          {loan.stage && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {loan.stage}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {loan.targetRate != null && (
                            <span className="text-xs text-gray-400">Target: <span className="text-gray-600">{fmtRate(loan.targetRate)}</span></span>
                          )}
                          {loan.pricingRate != null && (
                            <span className="text-xs text-gray-400">Pricing: <span className="text-gray-600">{fmtRate(loan.pricingRate)}</span></span>
                          )}
                          {loan.expectedCloseDate && (
                            <span className="text-xs text-gray-400">Close: <span className="text-gray-600">{fmtDate(loan.expectedCloseDate)}</span></span>
                          )}
                        </div>
                        {loan.notes && <p className="text-xs text-gray-400 mt-0.5">{loan.notes}</p>}
                      </div>
                      <p className="text-sm font-medium text-black flex-shrink-0">{fmt(loan.loanAmount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
