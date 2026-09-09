"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Person {
  id: string;
  name: string;
  role: string | null;
  lastContactedAt: string | null;
}

function daysSince(dateStr: string): string {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  return `${days}d ago`;
}

export default function OverdueWidget() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/overdue")
      .then((r) => r.json())
      .then(setPeople)
      .finally(() => setLoading(false));
  }, []);

  if (!loading && people.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
        No contact in 30+ days
      </h2>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-9 bg-gray-50 rounded" />
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {people.map((p) => (
            <li key={p.id}>
              <Link
                href={`/partners/${p.id}`}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-black truncate group-hover:underline underline-offset-2">
                    {p.name}
                  </p>
                  {p.role && (
                    <p className="text-xs text-gray-400 truncate">{p.role}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-3">
                  {p.lastContactedAt ? daysSince(p.lastContactedAt) : "never"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
