"use client";

import { useState, useEffect } from "react";

function isSunday() {
  return new Date().getDay() === 0;
}

export default function ConversationTracker() {
  const [savedCount, setSavedCount] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const sunday = isSunday();

  useEffect(() => {
    if (sunday) {
      setLoading(false);
      return;
    }
    fetch("/api/daily-log")
      .then((r) => r.json())
      .then((data) => {
        const c = data.count ?? 0;
        setCount(c);
        setSavedCount(c);
      })
      .finally(() => setLoading(false));
  }, [sunday]);

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

  const percentage = Math.round((count / 10) * 100);
  const isDirty = count !== savedCount;

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Today
        </h2>
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
            <div
              key={i}
              className="w-8 h-8 rounded-full border-2 border-gray-100 animate-pulse"
            />
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
                    filled
                      ? "bg-black border-black"
                      : "border-gray-300 hover:border-gray-500"
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
        </>
      )}
    </div>
  );
}
