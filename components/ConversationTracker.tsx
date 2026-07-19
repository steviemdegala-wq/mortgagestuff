"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PRESET_TAGS = ["Potential Lead", "Referral Partner"];

interface PartnerResult {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
  markets: string[];
  specializations: string[];
}

interface ConversationLog {
  id: string;
  slot: number;
  contactName: string;
  tags: string[];
  personId: string | null;
  partner: PartnerResult | null;
}

interface SlotState {
  logId: string | null;
  contactName: string;
  tags: string[];
  personId: string | null;
  partner: PartnerResult | null;
  suggestions: PartnerResult[];
  showSuggestions: boolean;
  customTagInput: string;
  saving: boolean;
}

function emptySlot(): SlotState {
  return {
    logId: null,
    contactName: "",
    tags: [],
    personId: null,
    partner: null,
    suggestions: [],
    showSuggestions: false,
    customTagInput: "",
    saving: false,
  };
}

function isSunday() {
  return new Date().getDay() === 0;
}

function todayDateStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function ConversationTracker() {
  const [savedCount, setSavedCount] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [slots, setSlots] = useState<SlotState[]>([]);
  const sunday = isSunday();
  const searchTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const dateStr = todayDateStr();

  const load = useCallback(async () => {
    const [logRes, activityRes] = await Promise.all([
      fetch("/api/daily-log").then((r) => r.json()),
      fetch(`/api/daily-activity?date=${dateStr}`).then((r) => r.json()),
    ]);
    const c = logRes.count ?? 0;
    setCount(c);
    setSavedCount(c);

    const logs: ConversationLog[] = activityRes?.conversationLogs ?? [];
    const logsBySlot = new Map<number, ConversationLog>();
    for (const log of logs) {
      logsBySlot.set(log.slot, log);
    }

    setSlots(
      Array.from({ length: 10 }, (_, i) => {
        const slot = i + 1;
        const log = logsBySlot.get(slot);
        if (log) {
          return {
            logId: log.id,
            contactName: log.contactName,
            tags: log.tags,
            personId: log.personId,
            partner: log.partner,
            suggestions: [],
            showSuggestions: false,
            customTagInput: "",
            saving: false,
          };
        }
        return emptySlot();
      })
    );
    setLoading(false);
  }, [dateStr]);

  useEffect(() => {
    if (!sunday) load();
    else setLoading(false);
  }, [sunday, load]);

  function handleCircleClick(index: number) {
    const newCount = index + 1 === count ? index : index + 1;
    setCount(newCount);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/daily-log", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      if (!res.ok) throw new Error("Failed");
      setSavedCount(count);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function updateSlot(index: number, patch: Partial<SlotState>) {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  async function searchPartners(index: number, query: string) {
    if (!query.trim()) {
      updateSlot(index, { suggestions: [], showSuggestions: false });
      return;
    }
    clearTimeout(searchTimers.current[index]);
    searchTimers.current[index] = setTimeout(async () => {
      const res = await fetch(`/api/people/search?q=${encodeURIComponent(query)}`);
      const data: PartnerResult[] = await res.json();
      updateSlot(index, { suggestions: data, showSuggestions: data.length > 0 });
    }, 200);
  }

  function handleNameChange(index: number, value: string) {
    updateSlot(index, {
      contactName: value,
      personId: null,
      partner: null,
      showSuggestions: false,
    });
    searchPartners(index, value);
  }

  function handleSelectPartner(index: number, partner: PartnerResult) {
    updateSlot(index, {
      contactName: partner.name,
      personId: partner.id,
      partner,
      suggestions: [],
      showSuggestions: false,
    });
    saveSlot(index, {
      contactName: partner.name,
      personId: partner.id,
      tags: slots[index].tags,
      logId: slots[index].logId,
    });
  }

  async function saveSlot(
    index: number,
    override?: { contactName: string; personId: string | null; tags: string[]; logId: string | null }
  ) {
    const s = override ?? {
      contactName: slots[index].contactName,
      personId: slots[index].personId,
      tags: slots[index].tags,
      logId: slots[index].logId,
    };
    if (!s.contactName.trim()) return;
    updateSlot(index, { saving: true });
    try {
      if (s.logId) {
        await fetch("/api/daily-activity/conversations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: s.logId,
            contactName: s.contactName,
            personId: s.personId,
            tags: s.tags,
          }),
        });
      } else {
        const res = await fetch("/api/daily-activity/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactName: s.contactName,
            personId: s.personId,
            tags: s.tags,
            slot: index + 1,
            date: dateStr,
          }),
        });
        const newLog = await res.json();
        updateSlot(index, { logId: newLog.id });
      }
    } finally {
      updateSlot(index, { saving: false });
    }
  }

  function toggleTag(index: number, tag: string) {
    const current = slots[index].tags;
    const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
    updateSlot(index, { tags: next });
    saveSlot(index, {
      contactName: slots[index].contactName,
      personId: slots[index].personId,
      tags: next,
      logId: slots[index].logId,
    });
  }

  function handleAddCustomTag(index: number) {
    const tag = slots[index].customTagInput.trim();
    if (!tag || slots[index].tags.includes(tag)) {
      updateSlot(index, { customTagInput: "" });
      return;
    }
    const next = [...slots[index].tags, tag];
    updateSlot(index, { tags: next, customTagInput: "" });
    saveSlot(index, {
      contactName: slots[index].contactName,
      personId: slots[index].personId,
      tags: next,
      logId: slots[index].logId,
    });
  }

  async function clearSlot(index: number) {
    const s = slots[index];
    if (s.logId) {
      await fetch(`/api/daily-activity/conversations?id=${s.logId}`, { method: "DELETE" });
    }
    updateSlot(index, emptySlot());
  }

  const percentage = Math.round((count / 10) * 100);
  const isDirty = count !== savedCount;

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Today</h2>
        {!sunday && !loading && (
          <span className="text-sm text-gray-500">
            {count} / 10 &nbsp;&middot;&nbsp; {percentage}%
          </span>
        )}
      </div>

      {sunday ? (
        <div className="py-6 text-center">
          <p className="text-gray-400 text-sm">Day off. See you Monday.</p>
        </div>
      ) : loading ? (
        <div className="flex gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 10 }).map((_, i) => {
              const filled = i < count;
              return (
                <button
                  key={i}
                  onClick={() => handleCircleClick(i)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    filled ? "bg-black border-black" : "border-gray-300 hover:border-gray-500"
                  }`}
                  aria-label={`${filled ? "Unmark" : "Mark"} conversation ${i + 1}`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-400">
              {count === 0
                ? "Click a circle to log a conversation."
                : count === 10
                ? "Goal reached. Great work."
                : `${10 - count} more to reach your goal.`}
            </p>
            <button
              onClick={handleSave}
              disabled={saving || (!isDirty && !saved)}
              className={`text-xs px-3 py-1.5 rounded transition-colors ${
                saved
                  ? "bg-gray-100 text-gray-500"
                  : isDirty
                  ? "bg-black text-white hover:bg-gray-900"
                  : "bg-gray-100 text-gray-400 cursor-default"
              }`}
            >
              {saving ? "Saving..." : saved ? "Saved" : "Save"}
            </button>
          </div>

          {count > 0 && (
            <div className="mt-5 space-y-3 border-t border-gray-100 pt-5">
              {Array.from({ length: count }).map((_, i) => {
                const s = slots[i];
                if (!s) return null;
                return (
                  <ConversationSlot
                    key={i}
                    index={i}
                    slot={s}
                    onNameChange={(v) => handleNameChange(i, v)}
                    onSelectPartner={(p) => handleSelectPartner(i, p)}
                    onBlur={() => saveSlot(i)}
                    onToggleTag={(tag) => toggleTag(i, tag)}
                    onCustomTagChange={(v) => updateSlot(i, { customTagInput: v })}
                    onAddCustomTag={() => handleAddCustomTag(i)}
                    onClear={() => clearSlot(i)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ConversationSlot({
  index,
  slot,
  onNameChange,
  onSelectPartner,
  onBlur,
  onToggleTag,
  onCustomTagChange,
  onAddCustomTag,
  onClear,
}: {
  index: number;
  slot: SlotState;
  onNameChange: (v: string) => void;
  onSelectPartner: (p: PartnerResult) => void;
  onBlur: () => void;
  onToggleTag: (tag: string) => void;
  onCustomTagChange: (v: string) => void;
  onAddCustomTag: () => void;
  onClear: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // close suggestions on outside click handled by blur
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-4 flex-shrink-0">{index + 1}</span>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Contact name"
            value={slot.contactName}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={() => {
              setTimeout(() => onBlur(), 150);
            }}
            className="w-full text-sm bg-white border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
          />
          {slot.showSuggestions && slot.suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-sm z-10 overflow-hidden">
              {slot.suggestions.map((p) => (
                <button
                  key={p.id}
                  onMouseDown={() => onSelectPartner(p)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-baseline gap-2"
                >
                  <span className="font-medium text-black">{p.name}</span>
                  {p.role && <span className="text-xs text-gray-400">{p.role}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        {slot.contactName && (
          <button
            onClick={onClear}
            className="text-xs text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
          >
            &#x2715;
          </button>
        )}
        {slot.saving && <span className="text-xs text-gray-400 flex-shrink-0">Saving...</span>}
      </div>

      {slot.partner && (
        <div className="ml-6 grid grid-cols-2 gap-x-4 gap-y-0.5">
          {slot.partner.role && (
            <p className="text-xs text-gray-500">{slot.partner.role}</p>
          )}
          {slot.partner.phone && (
            <p className="text-xs text-gray-500">{slot.partner.phone}</p>
          )}
          {slot.partner.email && (
            <p className="text-xs text-gray-500 col-span-2">{slot.partner.email}</p>
          )}
          {slot.partner.markets.length > 0 && (
            <p className="text-xs text-gray-400 col-span-2">
              {slot.partner.markets.join(", ")}
            </p>
          )}
          {slot.partner.specializations.length > 0 && (
            <p className="text-xs text-gray-400 col-span-2">
              {slot.partner.specializations.join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="ml-6 flex flex-wrap items-center gap-1.5">
        {PRESET_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => onToggleTag(tag)}
            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
              slot.tags.includes(tag)
                ? "bg-black text-white border-black"
                : "border-gray-300 text-gray-500 hover:border-gray-500"
            }`}
          >
            {tag}
          </button>
        ))}
        {slot.tags
          .filter((t) => !PRESET_TAGS.includes(t))
          .map((tag) => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className="text-xs px-2 py-0.5 rounded-full border bg-black text-white border-black"
            >
              {tag} &#x2715;
            </button>
          ))}
        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder="+ tag"
            value={slot.customTagInput}
            onChange={(e) => onCustomTagChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAddCustomTag()}
            className="text-xs w-16 border border-dashed border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
          />
        </div>
      </div>
    </div>
  );
}
