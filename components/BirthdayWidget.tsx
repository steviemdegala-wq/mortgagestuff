"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BirthdayEntry {
  id: string;
  name: string;
  birthday: string;
  daysUntil: number;
}

function formatBirthday(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function BirthdayWidget() {
  const [entries, setEntries] = useState<BirthdayEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/birthdays")
      .then((r) => r.json())
      .then((data) => setEntries(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">
        Upcoming birthdays
      </h2>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-400">No birthdays in the next 30 days.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => {
            const href = `/people/${entry.id}`;
            return (
              <li key={entry.id} className="flex items-center justify-between">
                <Link
                  href={href}
                  className="text-sm text-black hover:underline underline-offset-2"
                >
                  {entry.name}
                </Link>
                <div className="flex items-center gap-3 text-right">
                  <span className="text-xs text-gray-400">
                    {formatBirthday(entry.birthday)}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {entry.daysUntil === 0 ? "Today" : `${entry.daysUntil}d`}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
