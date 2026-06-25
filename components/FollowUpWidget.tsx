"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface FollowUp {
  id: string;
  name: string;
  role: string | null;
  followUpDate: string;
  lastContactedAt: string | null;
}

function daysAgo(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function relativeContact(dateStr: string): string {
  const days = daysAgo(dateStr);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export default function FollowUpWidget() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/followups")
      .then((r) => r.json())
      .then(setFollowUps)
      .finally(() => setLoading(false));
  }, []);

  if (loading || followUps.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Follow-ups due
        </h2>
        <span className="text-xs text-gray-400">{followUps.length} pending</span>
      </div>
      <div className="space-y-3">
        {followUps.map((f) => {
          const overdueDays = daysAgo(f.followUpDate);
          const isOverdue = overdueDays > 0;

          return (
            <div key={f.id} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Link
                  href={`/partners/${f.id}`}
                  className="text-sm font-medium text-black hover:underline underline-offset-2"
                >
                  {f.name}
                </Link>
                {f.role && (
                  <p className="text-xs text-gray-400">{f.role}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-xs font-medium ${isOverdue ? "text-red-500" : "text-gray-700"}`}>
                  {isOverdue ? `${overdueDays}d overdue` : "due today"}
                </p>
                {f.lastContactedAt && (
                  <p className="text-xs text-gray-400">
                    contacted {relativeContact(f.lastContactedAt)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
