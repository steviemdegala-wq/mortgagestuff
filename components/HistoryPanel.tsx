"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
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

function formatDateLabel(dateStr: string, range: Range): string {
  const d = new Date(dateStr + "T00:00:00");
  if (range === "week") {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  if (range === "month") {
    return d.getDate().toString();
  }
  return d.toLocaleDateString("en-US", { month: "short" });
}

export default function HistoryPanel() {
  const [range, setRange] = useState<Range>("week");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/stats?range=${range}`)
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, [range]);

  const tabs: { label: string; value: Range }[] = [
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
    { label: "Year", value: "year" },
  ];

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          History
        </h2>
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

      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Completion rate</p>
              <p className="text-2xl font-semibold text-black">
                {stats.completionRate}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {stats.completedDays} of {stats.totalWorkingDays} days hit 10
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Avg per day</p>
              <p className="text-2xl font-semibold text-black">
                {stats.avgPerDay}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {stats.totalConversations} total conversations
              </p>
            </div>
          </div>

          {stats.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={stats.chartData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
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
  );
}
