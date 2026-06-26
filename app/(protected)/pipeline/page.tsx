"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AddPipelineModal from "@/components/AddPipelineModal";
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

interface PipelineContact {
  id: string;
  name: string;
  stage: string | null;
  phone: string | null;
  occupation: string | null;
  loanAmount: number | null;
  _count: { notes: number };
}

export default function PipelinePage() {
  const [contacts, setContacts] = useState<PipelineContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
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

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  async function handleStageChange(id: string, stage: string) {
    // Update optimistically
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: stage || null } : c))
    );
    await fetch(`/api/pipeline/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: stage || null }),
    });
  }

  function handleCreated(contact: { id: string }) {
    setShowModal(false);
    router.push(`/pipeline/${contact.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-black">Pipeline</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-sm text-gray-400">
              {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}
            </p>
            {(() => {
              const total = contacts.reduce((sum, c) => sum + (c.loanAmount ?? 0), 0);
              return total > 0 ? (
                <p className="text-sm text-gray-500 font-medium">
                  &middot; {total.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} total
                </p>
              ) : null;
            })()}
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white text-sm px-4 py-2 rounded hover:bg-gray-900 transition-colors"
        >
          Add contact
        </button>
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
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
        ) : contacts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-400">
              {search || stageFilter
                ? "No contacts match your filters."
                : "No contacts yet. Add your first one."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden sm:table-cell">
                  Stage
                </th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden md:table-cell">
                  Occupation
                </th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">
                  Phone
                </th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact, i) => (
                <tr
                  key={contact.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    i < contacts.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <td
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => router.push(`/pipeline/${contact.id}`)}
                  >
                    <Link
                      href={`/pipeline/${contact.id}`}
                      className="text-sm font-medium text-black hover:underline underline-offset-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {contact.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={contact.stage ?? ""}
                      onChange={(e) => handleStageChange(contact.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-gray-400 bg-white text-gray-700"
                    >
                      <option value="">No stage</option>
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td
                    className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell cursor-pointer"
                    onClick={() => router.push(`/pipeline/${contact.id}`)}
                  >
                    {contact.occupation ?? <span className="text-gray-300">None</span>}
                  </td>
                  <td
                    className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell cursor-pointer"
                    onClick={() => router.push(`/pipeline/${contact.id}`)}
                  >
                    {contact.phone ?? <span className="text-gray-300">No phone</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <AddPipelineModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
