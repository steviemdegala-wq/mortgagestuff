"use client";

import { useState, useEffect } from "react";

function isSunday() {
  return new Date().getDay() === 0;
}

export default function ConversationTracker() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const sunday = isSunday();

  useEffect(() => {
    if (sunday) {
      setLoading(false);
      return;
    }
    fetch("/api/daily-log")
      .then((r) => r.json())
      .then((data) => setCount(data.count ?? 0))
      .finally(() => setLoading(false));
  }, [sunday]);

  async function handleCircleClick(index: number) {
    // index is 0-based. Clicking circle at index i:
    // - if i+1 > current count, fill up to i+1
    // - if i+1 <= count, set count to i (unfill from that position)
    const newCount = index + 1 === count ? index : index + 1;
    setCount(newCount);
    await fetch("/api/daily-log", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: newCount }),
    });
  }

  const percentage = Math.round((count / 10) * 100);

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
          <p className="text-xs text-gray-400 mt-4">
            {count === 0
              ? "Click a circle to log a conversation."
              : count === 10
              ? "Goal reached. Great work."
              : `${10 - count} more to reach your goal.`}
          </p>
        </>
      )}
    </div>
  );
}
