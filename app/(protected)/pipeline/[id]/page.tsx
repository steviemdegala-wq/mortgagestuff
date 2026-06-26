"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import InlineEdit from "@/components/InlineEdit";
import NoteSection from "@/components/NoteSection";

const STAGES = [
  "New Lead",
  "Pre-Qualified",
  "Application",
  "Processing",
  "Underwriting",
  "Closing",
  "Funded",
];

interface Note {
  id: string;
  body: string;
  createdAt: string;
}

interface PipelineContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  mailingAddress: string | null;
  occupation: string | null;
  birthday: string | null;
  stage: string | null;
  loanAmount: number | null;
  notes: Note[];
  createdAt: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
}

export default function PipelineProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<PipelineContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchContact = useCallback(async () => {
    const res = await fetch(`/api/pipeline/${id}`);
    if (!res.ok) {
      router.push("/pipeline");
      return;
    }
    const data = await res.json();
    setContact(data);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  async function patch(fields: Partial<PipelineContact>) {
    const res = await fetch(`/api/pipeline/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    setContact(data);
  }

  async function handleAddNote(body: string) {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, pipelineContactId: id }),
    });
    const note = await res.json();
    setContact((prev) =>
      prev ? { ...prev, notes: [note, ...prev.notes] } : prev
    );
  }

  async function handleDeleteNote(noteId: string) {
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    setContact((prev) =>
      prev
        ? { ...prev, notes: prev.notes.filter((n) => n.id !== noteId) }
        : prev
    );
  }

  async function handleEditNote(noteId: string, body: string) {
    const res = await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const updated = await res.json();
    setContact((prev) =>
      prev
        ? { ...prev, notes: prev.notes.map((n) => (n.id === noteId ? updated : n)) }
        : prev
    );
  }

  async function handleDelete() {
    if (!confirm("Delete this contact? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/pipeline/${id}`, { method: "DELETE" });
    router.push("/pipeline");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!contact) return null;

  return (
    <div className="max-w-2xl space-y-8">
      {/* Back */}
      <Link
        href="/pipeline"
        className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
      >
        Back to Pipeline
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-black">
            <InlineEdit
              value={contact.name}
              onSave={(v) => patch({ name: v })}
              className="text-2xl font-semibold"
            />
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Added {formatDate(contact.createdAt)}
          </p>
        </div>
        <div>
          <select
            value={contact.stage ?? ""}
            onChange={(e) => patch({ stage: e.target.value || null })}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 bg-white text-gray-700"
          >
            <option value="">No stage</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fields */}
      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
        {[
          { label: "Email", field: "email", type: "email" as const },
          { label: "Phone", field: "phone", type: "tel" as const },
          { label: "Occupation", field: "occupation", type: "text" as const },
          { label: "Mailing address", field: "mailingAddress", type: "text" as const },
        ].map(({ label, field, type }) => (
          <div key={field} className="flex items-start px-4 py-3 gap-4">
            <span className="text-xs font-medium text-gray-400 w-36 flex-shrink-0 pt-0.5">
              {label}
            </span>
            <div className="flex-1">
              <InlineEdit
                value={(contact[field as keyof PipelineContact] as string) ?? ""}
                onSave={(v) => patch({ [field]: v })}
                type={type}
                placeholder={`Add ${label.toLowerCase()}`}
              />
            </div>
          </div>
        ))}

        {/* Loan amount */}
        <div className="flex items-start px-4 py-3 gap-4">
          <span className="text-xs font-medium text-gray-400 w-36 flex-shrink-0 pt-0.5">
            Loan amount
          </span>
          <div className="flex-1">
            <InlineEdit
              value={contact.loanAmount != null ? String(contact.loanAmount) : ""}
              onSave={(v) => patch({ loanAmount: v ? parseFloat(v) : null } as Partial<PipelineContact>)}
              type="number"
              placeholder="Add loan amount"
            />
            {contact.loanAmount != null && (
              <p className="text-xs text-gray-400 mt-0.5">
                {contact.loanAmount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
              </p>
            )}
          </div>
        </div>

        {/* Birthday */}
        <div className="flex items-start px-4 py-3 gap-4">
          <span className="text-xs font-medium text-gray-400 w-36 flex-shrink-0 pt-0.5">
            Birthday
          </span>
          <div className="flex-1">
            <InlineEdit
              value={toDateInputValue(contact.birthday)}
              onSave={(v) => patch({ birthday: v || null } as Partial<PipelineContact>)}
              type="date"
              placeholder="Add birthday"
            />
            {contact.birthday && (
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDate(contact.birthday)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="border border-gray-200 rounded-lg p-6">
        <NoteSection
          notes={contact.notes}
          onAdd={handleAddNote}
          onDelete={handleDeleteNote}
          onEdit={handleEditNote}
        />
      </div>

      {/* Danger zone */}
      <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Delete contact</p>
          <p className="text-xs text-gray-400 mt-0.5">
            This will permanently delete all their data and notes.
          </p>
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
