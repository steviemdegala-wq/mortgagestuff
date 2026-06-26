"use client";

import { useState } from "react";

const STAGES = [
  "New Lead",
  "Pre-Qualified",
  "Application",
  "Processing",
  "Underwriting",
  "Closing",
  "Funded",
];

interface AddPipelineModalProps {
  onClose: () => void;
  onCreated: (contact: { id: string }) => void;
}

export default function AddPipelineModal({
  onClose,
  onCreated,
}: AddPipelineModalProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    occupation: "",
    stage: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof typeof form) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      const created = await res.json();
      onCreated(created);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
      <div className="bg-white border border-gray-200 rounded-lg w-full max-w-md p-6 shadow-lg">
        <h2 className="text-base font-semibold text-black mb-5">Add pipeline contact</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Stage</label>
            <select
              value={form.stage}
              onChange={set("stage")}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
            >
              <option value="">No stage</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Occupation</label>
            <input
              type="text"
              value={form.occupation}
              onChange={set("occupation")}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>

          {error && (
            <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-sm text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-black text-white text-sm px-4 py-2 rounded hover:bg-gray-900 disabled:opacity-50 transition-colors"
            >
              {saving ? "Adding..." : "Add contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
