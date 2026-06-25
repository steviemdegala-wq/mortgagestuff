"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const STAGES = [
  "New Lead",
  "Pre-Approval",
  "Application",
  "Processing",
  "Underwriting",
  "Closing",
  "Funded",
];

const STAGE_COLORS: Record<string, string> = {
  "New Lead":      "#94a3b8",
  "Pre-Approval":  "#3b82f6",
  "Application":   "#8b5cf6",
  "Processing":    "#f59e0b",
  "Underwriting":  "#ef4444",
  "Closing":       "#10b981",
  "Funded":        "#1a1a1a",
  "No stage":      "#e2e8f0",
};

interface Contact {
  stage: string | null;
  loanAmount: number | null;
}

interface Props {
  contacts: Contact[];
}

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function PipelineValueChart({ contacts }: Props) {
  const withAmount = contacts.filter((c) => c.loanAmount && c.loanAmount > 0);
  if (withAmount.length === 0) return null;

  const totals: Record<string, number> = {};
  for (const c of withAmount) {
    const key = c.stage ?? "No stage";
    totals[key] = (totals[key] ?? 0) + (c.loanAmount ?? 0);
  }

  const data = [
    ...STAGES.filter((s) => totals[s] > 0).map((s) => ({ name: s, value: totals[s] })),
    ...(totals["No stage"] ? [{ name: "No stage", value: totals["No stage"] }] : []),
  ];

  const grandTotal = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">
        Pipeline by stage
      </h2>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* Donut */}
        <div className="relative flex-shrink-0 w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={88}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STAGE_COLORS[entry.name] ?? "#94a3b8"}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as { name: string; value: number };
                  const pct = Math.round((d.value / grandTotal) * 100);
                  return (
                    <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs shadow-sm">
                      <p className="font-medium text-black">{d.name}</p>
                      <p className="text-gray-500">{formatAmount(d.value)} &middot; {pct}%</p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-base font-semibold text-black">{formatAmount(grandTotal)}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 w-full">
          {data.map((d) => {
            const pct = Math.round((d.value / grandTotal) * 100);
            return (
              <div key={d.name} className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: STAGE_COLORS[d.name] ?? "#94a3b8" }}
                />
                <span className="text-sm text-gray-700 flex-1">{d.name}</span>
                <span className="text-sm font-medium text-black">{formatAmount(d.value)}</span>
                <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
