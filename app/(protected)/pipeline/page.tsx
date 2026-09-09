"use client";

import { useEffect, useState, useCallback } from "react";
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
  return new Date(s + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PipelinePage() {
  const [contacts, setContacts] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const router = useRouter();

  const fetchContacts = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (stageFilter) params.set("stage", stageFilter);
    const res = await fetch(`/api/pipeline?${params}`);
    const data = await res.json();
    setContacts(data);
    setLoading(false);
  }, [search, stageFilter]);

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

      <PipelineValueChart contacts={contacts} />

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

      {/* Cards */}
      {loading ? (
        <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
      ) : contacts.length === 0 ? (
        <div className="p-8 text-center border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-400">No pipeline entries yet. Add a loan to a person to see them here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => {
            const contactTotal = contact.Loan.reduce((s, l) => s + l.loanAmount, 0);
            return (
              <div
                key={contact.id}
                className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors cursor-pointer"
                onClick={() => router.push(`/partners/${contact.id}`)}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-black">{contact.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {contact.role && <p className="text-xs text-gray-400">{contact.role}</p>}
                      {contact.stage && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {contact.stage}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-black flex-shrink-0">{fmt(contactTotal)}</p>
                </div>

                <div className="space-y-2">
                  {contact.Loan.map((loan) => (
                    <div key={loan.id} className="flex items-start gap-3 pl-3 border-l-2 border-gray-100">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-gray-800">{loan.name}</p>
                          <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                            {loan.loanType}
                          </span>
                          {contact.stage && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {contact.stage}
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
