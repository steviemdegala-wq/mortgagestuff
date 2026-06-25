"use client";

import { useState } from "react";

interface Note {
  id: string;
  body: string;
  createdAt: string;
}

interface NoteSectionProps {
  notes: Note[];
  onAdd: (body: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function NoteSection({ notes, onAdd, onDelete }: NoteSectionProps) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    try {
      await onAdd(body.trim());
      setBody("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
        Notes
      </h3>

      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note..."
          rows={3}
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-gray-400 resize-none"
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!body.trim() || saving}
            className="text-sm bg-black text-white px-4 py-1.5 rounded hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Add note"}
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-gray-400">No notes yet.</p>
      ) : (
        <ul className="space-y-4">
          {notes.map((note) => (
            <li
              key={note.id}
              className="border-t border-gray-100 pt-4 group"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-black whitespace-pre-wrap flex-1">{note.body}</p>
                <button
                  onClick={() => onDelete(note.id)}
                  className="text-xs text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  aria-label="Delete note"
                >
                  Delete
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">{formatDate(note.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
