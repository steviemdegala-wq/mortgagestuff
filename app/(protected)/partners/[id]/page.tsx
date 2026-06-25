"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import InlineEdit from "@/components/InlineEdit";
import TagInput from "@/components/TagInput";
import NoteSection from "@/components/NoteSection";

interface Note {
  id: string;
  body: string;
  createdAt: string;
}

interface Partner {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  role: string | null;
  markets: string[];
  specializations: string[];
  followUpDate: string | null;
  lastContactedAt: string | null;
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

export default function PartnerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [logging, setLogging] = useState(false);
  const [loggedFlash, setLoggedFlash] = useState(false);

  const fetchPartner = useCallback(async () => {
    const res = await fetch(`/api/partners/${id}`);
    if (!res.ok) {
      router.push("/partners");
      return;
    }
    const data = await res.json();
    setPartner(data);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchPartner();
  }, [fetchPartner]);

  async function patch(fields: Partial<Partner>) {
    const res = await fetch(`/api/partners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    setPartner(data);
  }

  async function handleAddTag(type: "markets" | "specializations", tag: string) {
    if (!partner) return;
    const current = partner[type];
    await patch({ [type]: [...current, tag] });
  }

  async function handleRemoveTag(type: "markets" | "specializations", tag: string) {
    if (!partner) return;
    const current = partner[type];
    await patch({ [type]: current.filter((t) => t !== tag) });
  }

  async function handleLogConversation() {
    setLogging(true);
    try {
      const res = await fetch(`/api/partners/${id}/log-contact`, { method: "POST" });
      const data = await res.json();
      setPartner(data.partner);
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
      body: JSON.stringify({ body, referralPartnerId: id }),
    });
    const note = await res.json();
    setPartner((prev) =>
      prev ? { ...prev, notes: [note, ...prev.notes] } : prev
    );
  }

  async function handleDeleteNote(noteId: string) {
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    setPartner((prev) =>
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
    setPartner((prev) =>
      prev
        ? { ...prev, notes: prev.notes.map((n) => (n.id === noteId ? updated : n)) }
        : prev
    );
  }

  async function handleDelete() {
    if (!confirm("Delete this partner? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/partners/${id}`, { method: "DELETE" });
    router.push("/partners");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!partner) return null;

  return (
    <div className="max-w-2xl space-y-8">
      {/* Back */}
      <Link
        href="/partners"
        className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
      >
        Back to Referral Partners
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-black">
            <InlineEdit
              value={partner.name}
              onSave={(v) => patch({ name: v })}
              className="text-2xl font-semibold"
            />
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-gray-400">Added {formatDate(partner.createdAt)}</p>
            {partner.lastContactedAt && (
              <p className="text-xs text-gray-400">
                &middot; Last contacted {formatDate(partner.lastContactedAt)}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleLogConversation}
          disabled={logging}
          className={`text-sm px-4 py-2 rounded transition-colors flex-shrink-0 ${
            loggedFlash
              ? "bg-gray-100 text-gray-600"
              : "bg-black text-white hover:bg-gray-900 disabled:opacity-50"
          }`}
        >
          {logging ? "Logging..." : loggedFlash ? "Conversation logged" : "Log conversation"}
        </button>
      </div>

      {/* Fields */}
      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
        {[
          { label: "Role", field: "role", type: "text" as const },
          { label: "Email", field: "email", type: "email" as const },
          { label: "Phone", field: "phone", type: "tel" as const },
        ].map(({ label, field, type }) => (
          <div key={field} className="flex items-start px-4 py-3 gap-4">
            <span className="text-xs font-medium text-gray-400 w-28 flex-shrink-0 pt-0.5">
              {label}
            </span>
            <div className="flex-1">
              <InlineEdit
                value={(partner[field as keyof Partner] as string) ?? ""}
                onSave={(v) => patch({ [field]: v })}
                type={type}
                placeholder={`Add ${label.toLowerCase()}`}
              />
            </div>
          </div>
        ))}

        {/* Birthday */}
        <div className="flex items-start px-4 py-3 gap-4">
          <span className="text-xs font-medium text-gray-400 w-28 flex-shrink-0 pt-0.5">
            Birthday
          </span>
          <div className="flex-1">
            <InlineEdit
              value={toDateInputValue(partner.birthday)}
              onSave={(v) => patch({ birthday: v || null } as Partial<Partner>)}
              type="date"
              placeholder="Add birthday"
            />
            {partner.birthday && (
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDate(partner.birthday)}
              </p>
            )}
          </div>
        </div>

        {/* Follow-up date */}
        <div className="flex items-start px-4 py-3 gap-4">
          <span className="text-xs font-medium text-gray-400 w-28 flex-shrink-0 pt-0.5">
            Follow-up
          </span>
          <div className="flex-1">
            <InlineEdit
              value={toDateInputValue(partner.followUpDate)}
              onSave={(v) => patch({ followUpDate: v || null } as Partial<Partner>)}
              type="date"
              placeholder="Set follow-up date"
            />
            {partner.followUpDate && (
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDate(partner.followUpDate)}
              </p>
            )}
          </div>
        </div>

        {/* Markets */}
        <div className="flex items-start px-4 py-3 gap-4">
          <span className="text-xs font-medium text-gray-400 w-28 flex-shrink-0 pt-1">
            Markets
          </span>
          <div className="flex-1">
            <TagInput
              tags={partner.markets}
              onAdd={(tag) => handleAddTag("markets", tag)}
              onRemove={(tag) => handleRemoveTag("markets", tag)}
              suggestionType="markets"
              placeholder="Add market"
            />
          </div>
        </div>

        {/* Specializations */}
        <div className="flex items-start px-4 py-3 gap-4">
          <span className="text-xs font-medium text-gray-400 w-28 flex-shrink-0 pt-1">
            Specializations
          </span>
          <div className="flex-1">
            <TagInput
              tags={partner.specializations}
              onAdd={(tag) => handleAddTag("specializations", tag)}
              onRemove={(tag) => handleRemoveTag("specializations", tag)}
              suggestionType="specializations"
              placeholder="Add specialization"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="border border-gray-200 rounded-lg p-6">
        <NoteSection
          notes={partner.notes}
          onAdd={handleAddNote}
          onDelete={handleDeleteNote}
          onEdit={handleEditNote}
        />
      </div>

      {/* Danger zone */}
      <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Delete partner</p>
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
