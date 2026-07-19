"use client";

import { useState, useEffect, useCallback } from "react";

const DAY_THEMES: Record<number, string> = {
  1: "Realtors You Know",
  2: "Pipeline Status Calls",
  3: "Past Clients / COI",
  4: "Realtor / Builder Targets",
  5: "Other Professionals",
};

const NETWORKING_TARGETS = [
  { key: "likes", label: "Likes", target: 10 },
  { key: "comments", label: "Comments", target: 5 },
  { key: "connectionRequests", label: "Connections", target: 5 },
  { key: "dms", label: "DMs", target: 3 },
  { key: "posts", label: "Posts", target: 1 },
] as const;

type NetworkingKey = (typeof NETWORKING_TARGETS)[number]["key"];

interface Activity {
  likes: number;
  comments: number;
  connectionRequests: number;
  dms: number;
  posts: number;
  followUps: number;
  newLeads: number;
  creditPulls: number;
  exerciseMinutes: number;
  readingMinutes: number;
}

function todayDateStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-6 h-6 rounded border border-gray-300 text-gray-500 text-xs flex items-center justify-center hover:border-gray-500 hover:text-black transition-colors"
      >
        -
      </button>
      <span className="w-5 text-center text-sm font-medium text-black tabular-nums">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-6 h-6 rounded border border-gray-300 text-gray-500 text-xs flex items-center justify-center hover:border-gray-500 hover:text-black transition-colors"
      >
        +
      </button>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 w-full text-left"
    >
      <span
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          checked ? "bg-black border-black" : "border-gray-300"
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-sm text-gray-600">{label}</span>
    </button>
  );
}

export default function TlopActivityPanel() {
  const day = new Date().getDay();
  const theme = DAY_THEMES[day];

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const dateStr = todayDateStr();

  const load = useCallback(() => {
    fetch(`/api/daily-activity?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => setActivity(data))
      .finally(() => setLoading(false));
  }, [dateStr]);

  useEffect(() => { load(); }, [load]);

  function update(field: string, value: number) {
    setActivity((prev) => (prev ? { ...prev, [field]: value } : null));
    setDirty(true);
    setSaved(false);
  }

  function toggleBool(field: "exerciseMinutes" | "readingMinutes", defaultMinutes: number) {
    const current = activity?.[field] ?? 0;
    update(field, current > 0 ? 0 : defaultMinutes);
  }

  async function handleSave() {
    if (!dirty) return;
    setSaving(true);
    try {
      const a = activity ?? { likes: 0, comments: 0, connectionRequests: 0, dms: 0, posts: 0, followUps: 0, newLeads: 0, creditPulls: 0, exerciseMinutes: 0, readingMinutes: 0 };
      const res = await fetch("/api/daily-activity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, ...a }),
      });
      const data = await res.json();
      setActivity(data);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const a: Activity = activity ?? {
    likes: 0, comments: 0, connectionRequests: 0, dms: 0, posts: 0,
    followUps: 0, newLeads: 0, creditPulls: 0, exerciseMinutes: 0, readingMinutes: 0,
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Today&apos;s Activity
          </h2>
          {theme && (
            <p className="text-xs text-gray-400 mt-0.5">Today: {theme}</p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || (!dirty && !saved)}
          className={`text-xs px-3 py-1.5 rounded transition-colors ${
            saved
              ? "bg-gray-100 text-gray-500"
              : dirty
              ? "bg-black text-white hover:bg-gray-900"
              : "bg-gray-100 text-gray-400 cursor-default"
          }`}
        >
          {saving ? "Saving..." : saved ? "Saved" : "Save"}
        </button>
      </div>

      {loading ? (
        <div className="h-20 flex items-center justify-center">
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      ) : (
        <>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              30 Min Online Networking
            </p>
            <div className="space-y-2">
              {NETWORKING_TARGETS.map(({ key, label, target }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className="text-xs text-gray-400">/ {target}</span>
                    {a[key as NetworkingKey] >= target && (
                      <span className="text-xs text-gray-400">&#10003;</span>
                    )}
                  </div>
                  <Stepper value={a[key as NetworkingKey]} onChange={(v) => update(key, v)} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Outreach
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Follow-ups</span>
                <Stepper value={a.followUps} onChange={(v) => update("followUps", v)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New Leads</span>
                <Stepper value={a.newLeads} onChange={(v) => update("newLeads", v)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Credit Pulls</span>
                <Stepper value={a.creditPulls} onChange={(v) => update("creditPulls", v)} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Health
            </p>
            <div className="space-y-3">
              <Checkbox
                label="Exercise"
                checked={a.exerciseMinutes > 0}
                onChange={() => toggleBool("exerciseMinutes", 50)}
              />
              <Checkbox
                label="Reading"
                checked={a.readingMinutes > 0}
                onChange={() => toggleBool("readingMinutes", 15)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
