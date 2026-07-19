"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const GRAY_SHADES = [
  "#111827", "#374151", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db",
];

interface Person {
  tags: string[];
}

interface Props {
  people: Person[];
}

export default function PartnerDemographicsChart({ people }: Props) {
  if (people.length === 0) return null;

  const tagCounts: Record<string, number> = {};
  let untagged = 0;

  for (const person of people) {
    if (person.tags.length === 0) {
      untagged++;
    } else {
      for (const tag of person.tags) {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      }
    }
  }

  const data = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  if (untagged > 0) data.push({ name: "Untagged", value: untagged });

  if (data.length === 0) return null;

  const grandTotal = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">
        Network breakdown
      </h2>

      <div className="flex flex-col sm:flex-row items-center gap-8">
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
                {data.map((_, i) => (
                  <Cell key={i} fill={GRAY_SHADES[i % GRAY_SHADES.length]} />
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
                      <p className="text-gray-500">
                        {d.value} {d.value === 1 ? "person" : "people"} &middot; {pct}%
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-base font-semibold text-black">{people.length}</p>
          </div>
        </div>

        <div className="flex-1 space-y-2 w-full">
          {data.map((d, i) => {
            const pct = Math.round((d.value / grandTotal) * 100);
            return (
              <div key={d.name} className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: GRAY_SHADES[i % GRAY_SHADES.length] }}
                />
                <span className="text-sm text-gray-700 flex-1">{d.name}</span>
                <span className="text-sm font-medium text-black">{d.value}</span>
                <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
