"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

type Range = "week" | "month" | "year";

interface Stats {
  completionRate: number;
  avgPerDay: number;
  completedDays: number;
  totalWorkingDays: number;
  totalConversations: number;
  chartData: { date: string; count: number }[];
}

interface ActivityMetrics {
  posts: number;
  likes: number;
  comments: number;
  dms: number;
  connectionRequests: number;
  followUps: number;
  newLeads: number;
  creditPulls: number;
  exerciseMinutes: number;
  readingMinutes: number;
}

const METRIC_FIELDS: { key: keyof ActivityMetrics; label: string }[] = [
  { key: "posts",              label: "Posts" },
  { key: "newLeads",          label: "New Leads" },
  { key: "creditPulls",       label: "Credit Pulls" },
  { key: "dms",               label: "DMs" },
  { key: "likes",             label: "Likes" },
  { key: "comments",          label: "Comments" },
  { key: "connectionRequests", label: "Connection Requests" },
  { key: "followUps",         label: "Follow-Ups" },
  { key: "exerciseMinutes",   label: "Exercise (min)" },
  { key: "readingMinutes",    label: "Reading (min)" },
];

const emptyMetrics: ActivityMetrics = {
  posts: 0, likes: 0, comments: 0, dms: 0,
  connectionRequests: 0, followUps: 0, newLeads: 0,
  creditPulls: 0, exerciseMinutes: 0, readingMinutes: 0,
};

function formatDateLabel(dateStr: string, range: Range): string {
  const d = new Date(dateStr + "T00:00:00");
  if (range === "week") return d.toLocaleDateString("en-US", { weekday: "short" });
  if (range === "month") return d.getDate().toString();
  return d.toLocaleDateString("en-US", { month: "short" });
}

function todayStr(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
}

export default function HistoryPanel() {
  const [range, setRange] = useState<Range>("week");
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [metrics, setMetrics] = useState<ActivityMetrics>(emptyMetrics);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load today's activity metrics
  useEffect(() => {
    fetch(`/api/activity?date=${todayStr()}`)
      .then((r) => r.json())
      .then((data) => {
        setMetrics({
          posts: data.posts ?? 0,
          likes: data.likes ?? 0,
          comments: data.comments ?? 0,
          dms: data.dms ?? 0,
          connectionRequests: data.connectionRequests ?? 0,
          followUps: data.followUps ?? 0,
          newLeads: data.newLeads ?? 0,
          creditPulls: data.creditPulls ?? 0,
          exerciseMinutes: data.exerciseMinutes ?? 0,
          readingMinutes: data.readingMinutes ?? 0,
        });
      })
      .finally(() => setMetricsLoading(false));
  }, []);

  // Load stats chart
  useEffect(() => {
    setStatsLoading(true);
    fetch(`/api/dashboard/stats?range=${range}`)
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setStatsLoading(false));
  }, [range]);

  function handleMetricChange(key: keyof ActivityMetrics, value: string) {
    setMetrics((prev) => ({ ...prev, [key]: Number(value) || 0 }));
    setSaved(false);
  }

  async function handleSaveMetrics() {
    setSaving(true);
    await fetch(`/api/activity?date=${todayStr()}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metrics),
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  const tabs: { label: string; value: Range }[] = [
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
    { label: "Year", value: "year" },
  ];

  return (
    <div className="space-y-4">
      {/* Daily Activity Inputs */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Today's Activity</h2>
          <button
            onClick={handleSaveMetrics}
            disabled={saving}
            className={`text-xs px-3 py-1.5 rounded transition-colors ${
              saved
                ? "bg-gray-100 text-gray-500"
                : "bg-black text-white hover:bg-gray-900"
            }`}
          >
            {saving ? "Saving..." : saved ? "Saved" : "Save"}
          </button>
        </div>

        {metricsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {METRIC_FIELDS.map((f) => (
              <div key={f.key} className="animate-pulse h-10 bg-gray-50 rounded" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {METRIC_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-36 flex-shrink-0">{label}</label>
                <input
                  type="number"
                  min={0}
                  value={metrics[key]}
                  onChange={(e) => handleMetricChange(key, e.target.value)}
                  className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-gray-400"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conversation History Chart */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">History</h2>
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setRange(tab.value)}
                className={`text-xs px-3 py-1.5 rounded transition-colors ${
                  range === tab.value
                    ? "bg-black text-white"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {statsLoading ? (
          <div className="h-40 flex items-center justify-center">
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Completion rate</p>
                <p className="text-2xl font-semibold text-black">{stats.completionRate}%</p>
                <p className="text-xs text-gray-400 mt-1">{stats.completedDays} of {stats.totalWorkingDays} days hit 10</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Avg per day</p>
                <p className="text-2xl font-semibold text-black">{stats.avgPerDay}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.totalConversations} total conversations</p>
              </div>
            </div>

            {stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => formatDateLabel(v, range)}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 10]}
                    ticks={[0, 5, 10]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as { date: string; count: number };
                      return (
                        <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs shadow-sm">
                          <p className="text-gray-500">{d.date}</p>
                          <p className="font-medium text-black">{d.count} conversations</p>
                        </div>
                      );
                    }}
                    cursor={{ fill: "#f3f4f6" }}
                  />
                  <ReferenceLine y={10} stroke="#e5e7eb" strokeDasharray="4 2" />
                  <Bar dataKey="count" fill="#000000" radius={[2, 2, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center">
                <p className="text-sm text-gray-400">No data for this period.</p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
