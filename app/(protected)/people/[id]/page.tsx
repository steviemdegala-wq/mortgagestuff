"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import InlineEdit from "@/components/InlineEdit";
import TagInput from "@/components/TagInput";
import NoteSection from "@/components/NoteSection";

const STAGES = ["New Lead", "Pre-Qualified", "Application", "Processing", "Underwriting", "Closing", "Funded"];
const PRESET_TAGS = ["Referral Partner", "Pipeline", "Past Client", "COI", "Realtor", "Builder", "Attorney", "Financial Advisor", "HR Manager", "Other Professional"];

interface Note { id: string; body: string; createdAt: string; }

interface Person {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  role: string | null;
  mailingAddress: string | null;
  markets: string[];
  specializations: string[];
  tags: string[];
  stage: string | null;
  loanAmount: number | null;
  followUpDate: string | null;
  lastContactedAt: string | null;
  notes: Note[];
  createdAt: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function toDateInput(dateStr: string | null): string {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
}

export default function PersonProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [logging, setLogging] = useState(false);
  const [loggedFlash, setLoggedFlash] = useState(false);

  const fetchPerson = useCallback(async () => {
    const res = await fetch(`/api/people/${id}`);
    if (!res.ok) { router.push("/people"); return; }
    setPerson(await res.json());
    setLoading(false);
  }, [id, router]);

  useEffect(() => { fetchPerson(); }, [fetchPerson]);

  async function patch(fields: Partial<Person>) {
    const res = await fetch(`/api/people/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    setPerson(await res.json());
  }

  async function handleLogConversation() {
    setLogging(true);
    try {
      const res = await fetch(`/api/people/${id}/log-contact`, { method: "POST" });
      const data = await res.json();
      setPerson(data.person);
      setLoggedFlash(true);
      setTimeout(() => setLoggedFlash(false), 2500);
    } finally {
      setLogging(false);
    }
  }

  async function handleAddNote(body: string) {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, personId: id }),
    });
    const note = await res.json();
    setPerson((prev) => prev ? { ...prev, notes: [note, ...prev.notes] } : prev);
  }

  async function handleDeleteNote(noteId: string) {
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    setPerson((prev) => prev ? { ...prev, notes: prev.notes.filter((n) => n.id !== noteId) } : prev);
  }

  async function handleEditNote(noteId: string, body: string) {
    const res = await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const updated = await res.json();
    setPerson((prev) => prev ? { ...prev, notes: prev.notes.map((n) => n.id === noteId ? updated : n) } : prev);
  }

  async function handleDelete() {
    if (!confirm("Delete this person? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/people/${id}`, { method: "DELETE" });
    router.push("/people");
  }

  if (loading) return <div className="flex items-center justify-center py-16"><p className="text-sm text-gray-400">Loading...</p></div>;
  if (!person) return null;

  const isPipeline = person.tags.includes("Pipeline") || !!person.stage || !!person.loanAmount;

  return (
    <div className="max-w-2xl space-y-8">
      <Link href="/people" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
        Back to People
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-black">
            <InlineEdit value={person.name} onSave={(v) => patch({ name: v })} className="text-2xl font-semibold" />
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-xs text-gray-400">Added {formatDate(person.createdAt)}</p>
            {person.lastContactedAt && (
              <p className="text-xs text-gray-400">&middot; Last contacted {formatDate(person.lastContactedAt)}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isPipeline && (
            <select
              value={person.stage ?? ""}
              onChange={(e) => patch({ stage: e.target.value || null })}
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 bg-white text-gray-700"
            >
              <option value="">No stage</option>
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <button
            onClick={handleLogConversation}
            disabled={logging}
            className={`text-sm px-4 py-2 rounded transition-colors flex-shrink-0 ${
              loggedFlash ? "bg-gray-100 text-gray-600" : "bg-black text-white hover:bg-gray-900 disabled:opacity-50"
            }`}
          >
            {logging ? "Logging..." : loggedFlash ? "Conversation logged" : "Log conversation"}
          </button>
        </div>
      </div>

      {/* Contact info */}
      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
        {[
          { label: "Role", field: "role", type: "text" as const },
          { label: "Email", field: "email", type: "email" as const },
          { label: "Phone", field: "phone", type: "tel" as const },
          { label: "Mailing address", field: "mailingAddress", type: "text" as const },
        ].map(({ label, field, type }) => (
          <div key={field} className="flex items-start px-4 py-3 gap-4">
            <span className="text-xs font-medium text-gray-400 w-32 flex-shrink-0 pt-0.5">{label}</span>
            <div className="flex-1">
              <InlineEdit
                value={(person[field as keyof Person] as string) ?? ""}
                onSave={(v) => patch({ [field]: v })}
                type={type}
                placeholder={`Add ${label.toLowerCase()}`}
              />
            </div>
          </div>
        ))}

        <div className="flex items-start px-4 py-3 gap-4">
          <span className="text-xs font-medium text-gray-400 w-32 flex-shrink-0 pt-0.5">Birthday</span>
          <div className="flex-1">
            <InlineEdit
              value={toDateInput(person.birthday)}
              onSave={(v) => patch({ birthday: v || null } as Partial<Person>)}
              type="date"
              placeholder="Add birthday"
            />
            {person.birthday && <p className="text-xs text-gray-400 mt-0.5">{formatDate(person.birthday)}</p>}
          </div>
        </div>

        <div className="flex items-start px-4 py-3 gap-4">
          <span className="text-xs font-medium text-gray-400 w-32 flex-shrink-0 pt-0.5">Follow-up</span>
          <div className="flex-1">
            <InlineEdit
              value={toDateInput(person.followUpDate)}
              onSave={(v) => patch({ followUpDate: v || null } as Partial<Person>)}
              type="date"
              placeholder="Set follow-up date"
            />
            {person.followUpDate && <p className="text-xs text-gray-400 mt-0.5">{formatDate(person.followUpDate)}</p>}
          </div>
        </div>

        {isPipeline && (
          <div className="flex items-start px-4 py-3 gap-4">
            <span className="text-xs font-medium text-gray-400 w-32 flex-shrink-0 pt-0.5">Loan amount</span>
            <div className="flex-1">
              <InlineEdit
                value={person.loanAmount != null ? String(person.loanAmount) : ""}
                onSave={(v) => patch({ loanAmount: v ? parseFloat(v) : null } as Partial<Person>)}
                type="number"
                placeholder="Add loan amount"
              />
              {person.loanAmount != null && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {person.loanAmount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-start px-4 py-3 gap-4">
          <span className="text-xs font-medium text-gray-400 w-32 flex-shrink-0 pt-1">Tags</span>
          <div className="flex-1">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    const next = person.tags.includes(tag)
                      ? person.tags.filter((t) => t !== tag)
                      : [...person.tags, tag];
                    patch({ tags: next });
                  }}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    person.tags.includes(tag)
                      ? "bg-black text-white border-black"
                      : "border-gray-300 text-gray-500 hover:border-gray-500"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <TagInput
              tags={person.tags.filter((t) => !PRESET_TAGS.includes(t))}
              onAdd={(tag) => patch({ tags: [...person.tags, tag] })}
              onRemove={(tag) => patch({ tags: person.tags.filter((t) => t !== tag) })}
              placeholder="Add custom tag"
            />
          </div>
        </div>

        <div className="flex items-start px-4 py-3 gap-4">
          <span className="text-xs font-medium text-gray-400 w-32 flex-shrink-0 pt-1">Markets</span>
          <div className="flex-1">
            <TagInput
              tags={person.markets}
              onAdd={(tag) => patch({ markets: [...person.markets, tag] })}
              onRemove={(tag) => patch({ markets: person.markets.filter((t) => t !== tag) })}
              suggestionType="markets"
              placeholder="Add market"
            />
          </div>
        </div>

        <div className="flex items-start px-4 py-3 gap-4">
          <span className="text-xs font-medium text-gray-400 w-32 flex-shrink-0 pt-1">Specializations</span>
          <div className="flex-1">
            <TagInput
              tags={person.specializations}
              onAdd={(tag) => patch({ specializations: [...person.specializations, tag] })}
              onRemove={(tag) => patch({ specializations: person.specializations.filter((t) => t !== tag) })}
              suggestionType="specializations"
              placeholder="Add specialization"
            />
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-6">
        <NoteSection notes={person.notes} onAdd={handleAddNote} onDelete={handleDeleteNote} onEdit={handleEditNote} />
      </div>

      <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Delete person</p>
          <p className="text-xs text-gray-400 mt-0.5">This will permanently delete all their data and notes.</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm border border-gray-200 text-gray-600 px-4 py-1.5 rounded hover:bg-gray-50 hover:text-black disabled:opacity-50 transition-colors"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
