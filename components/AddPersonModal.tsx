"use client";

import { useState } from "react";

const PRESET_TAGS = ["Referral Partner", "Pipeline", "Past Client", "COI", "Realtor", "Builder", "Attorney", "Financial Advisor", "HR Manager"];

interface Props {
  onClose: () => void;
  onCreated: (person: { id: string; name: string }) => void;
  initialName?: string;
}

export default function AddPersonModal({ onClose, onCreated, initialName = "" }: Props) {
  const [form, setForm] = useState({ name: initialName, email: "", phone: "", role: "" });
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function toggleTag(tag: string) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tags }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error ${res.status}`);
      }
      const created = await res.json();
      onCreated({ id: created.id, name: created.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
      <div className="bg-white border border-gray-200 rounded-lg w-full max-w-md p-6 shadow-lg">
        <h2 className="text-base font-semibold text-black mb-5">Add person</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={set("name")} autoFocus
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
            <input type="text" value={form.role} onChange={set("role")} placeholder="e.g. Realtor, Attorney"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
            <input type="tel" value={form.phone} onChange={set("phone")}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input type="email" value={form.email} onChange={set("email")}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TAGS.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    tags.includes(tag) ? "bg-black text-white border-black" : "border-gray-300 text-gray-500 hover:border-gray-500"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-sm text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-black text-white text-sm px-4 py-2 rounded hover:bg-gray-900 disabled:opacity-50 transition-colors">
              {saving ? "Adding..." : "Add person"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
