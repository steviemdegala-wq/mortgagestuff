"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Range = "month" | "3months" | "year";

interface DayRow {
  day: string;
  avgConversations: number;
  avgFollowUps: number;
  avgNewLeads: number;
  avgCreditPulls: number;
  sampleSize: number;
}

interface DayOfWeekData {
  rows: DayRow[];
  bestDay: string;
  worstDay: string;
}

const RANGE_LABELS: { label: string; value: Range }[] = [
  { label: "Month", value: "month" },
  { label: "3 Months", value: "3months" },
  { label: "Year", value: "year" },
];

// Dark to light gray shading based on value rank
function getBarFill(value: number, values: number[]): string {
  const sorted = [...values].sort((a, b) => b - a);
  const rank = sorted.indexOf(value);
  const shades = ["#111827", "#374151", "#6b7280", "#9ca3af", "#d1d5db", "#e5e7eb"];
  return shades[Math.min(rank, shades.length - 1)];
}

export default function DayOfWeekPanel() {
  const [range, setRange] = useState<Range>("month");
  const [data, setData] = useState<DayOfWeekData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tlop/day-of-week?range=${range}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [range]);

  const convValues = data?.rows.map((r) => r.avgConversations) ?? [];

  return (
    <div className="border border-gray-200 rounded-lg p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Day of Week Performance
        </h2>
        <div className="flex gap-1">
          {RANGE_LABELS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`text-xs px-3 py-1.5 rounded transition-colors ${
                range === r.value
                  ? "bg-black text-white"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      ) : data && data.rows.some((r) => r.sampleSize > 0) ? (
        <>
          {/* Best / Worst callout */}
          {(data.bestDay || data.worstDay) && (
            <div className="flex gap-4 text-xs text-gray-500">
              {data.bestDay && (
                <span>Best day: <span className="font-medium text-black">{data.bestDay}</span></span>
              )}
              {data.worstDay && (
                <span>Lowest day: <span className="font-medium text-black">{data.worstDay}</span></span>
              )}
            </div>
          )}

          {/* Bar chart */}
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={data.rows}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="day"
                tickFormatter={(v: string) => v.slice(0, 3)}
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
                  const d = payload[0].payload as DayRow;
                  return (
                    <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs shadow-sm">
                      <p className="font-medium text-black mb-1">{d.day}</p>
                      <p className="text-gray-500">Avg conversations: {d.avgConversations}</p>
                      {d.sampleSize > 0 && (
                        <p className="text-gray-400 mt-0.5">{d.sampleSize} day{d.sampleSize !== 1 ? "s" : ""} of data</p>
                      )}
                    </div>
                  );
                }}
                cursor={{ fill: "#f9fafb" }}
              />
              <Bar dataKey="avgConversations" radius={[2, 2, 0, 0]} maxBarSize={28}>
                {data.rows.map((row, i) => (
                  <Cell key={i} fill={getBarFill(row.avgConversations, convValues)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Comparison table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 text-gray-400 font-medium">Day</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Convos</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Follow-ups</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">New Leads</th>
                  <th className="text-right py-2 pl-3 text-gray-400 font-medium">Credit Pulls</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.day} className="border-b border-gray-50">
                    <td className={`py-2 pr-4 font-medium ${row.day === data.bestDay ? "text-black" : "text-gray-600"}`}>
                      {row.day.slice(0, 3)}
                      {row.day === data.bestDay && (
                        <span className="ml-1 text-gray-400 font-normal">best</span>
                      )}
                      {row.day === data.worstDay && (
                        <span className="ml-1 text-gray-400 font-normal">low</span>
                      )}
                    </td>
                    <td className="text-right py-2 px-3 text-gray-700">{row.avgConversations}</td>
                    <td className="text-right py-2 px-3 text-gray-700">{row.avgFollowUps}</td>
                    <td className="text-right py-2 px-3 text-gray-700">{row.avgNewLeads}</td>
                    <td className="text-right py-2 pl-3 text-gray-700">{row.avgCreditPulls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="h-40 flex items-center justify-center">
          <p className="text-sm text-gray-400">No data for this period.</p>
        </div>
      )}
    </div>
  );
}
