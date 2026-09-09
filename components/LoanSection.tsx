"use client";

import { useState } from "react";

export const PIPELINE_STAGES = [
  "New Lead",
  "Pre-Qualified",
  "Application",
  "Processing",
  "Underwriting",
  "Closing",
  "Funded",
];

export const LOAN_TYPES = [
  "DSCR",
  "Conventional",
  "FHA",
  "VA",
  "Doctor Loan",
  "Bank Statement",
  "Fix & Flip",
  "Bridge / Construction",
  "HELOC",
  "USDA",
  "Jumbo",
  "Refinance",
  "Hard Money / Private Money",
  "Investor LOC",
] as const;

export interface Loan {
  id: string;
  name: string;
  loanAmount: number;
  loanType: string;
  targetRate: number | null;
  pricingRate: number | null;
  notes: string | null;
  expectedCloseDate: string | null;
  createdAt: string;
}

interface LoanFormState {
  name: string;
  loanAmount: string;
  loanType: string;
  targetRate: string;
  pricingRate: string;
  notes: string;
  expectedCloseDate: string;
}

const emptyForm: LoanFormState = {
  name: "",
  loanAmount: "",
  loanType: "Conventional",
  targetRate: "",
  pricingRate: "",
  notes: "",
  expectedCloseDate: "",
};

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function fmtRate(n: number | null) {
  if (n == null) return null;
  return `${n.toFixed(3)}%`;
}

interface LoanFormProps {
  initial?: LoanFormState;
  onSave: (form: LoanFormState) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function LoanForm({ initial = emptyForm, onSave, onCancel, saving }: LoanFormProps) {
  const [form, setForm] = useState<LoanFormState>(initial);

  function set(field: keyof LoanFormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Loan name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. John Smith Purchase"
            className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Loan type</label>
          <select
            value={form.loanType}
            onChange={(e) => set("loanType", e.target.value)}
            className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 bg-white text-gray-700"
          >
            {LOAN_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Loan amount ($)</label>
          <input
            type="number"
            value={form.loanAmount}
            onChange={(e) => set("loanAmount", e.target.value)}
            placeholder="0"
            className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Target rate (%)</label>
          <input
            type="number"
            step="0.001"
            value={form.targetRate}
            onChange={(e) => set("targetRate", e.target.value)}
            placeholder="0.000"
            className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">My pricing (%)</label>
          <input
            type="number"
            step="0.001"
            value={form.pricingRate}
            onChange={(e) => set("pricingRate", e.target.value)}
            placeholder="0.000"
            className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Expected close date</label>
          <input
            type="date"
            value={form.expectedCloseDate}
            onChange={(e) => set("expectedCloseDate", e.target.value)}
            className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Notes</label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Any details..."
            className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.name || !form.loanAmount || !form.loanType}
          className="text-sm bg-black text-white px-4 py-1.5 rounded hover:bg-gray-900 disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving..." : "Save loan"}
        </button>
      </div>
    </div>
  );
}

interface Props {
  contactId: string;
  loans: Loan[];
  onChange: (loans: Loan[]) => void;
  stage?: string | null;
  onStageChange?: (stage: string | null) => void;
}

export default function LoanSection({ contactId, loans, onChange, stage, onStageChange }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const total = loans.reduce((sum, l) => sum + l.loanAmount, 0);

  async function handleAdd(form: LoanFormState) {
    setSaving(true);
    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, personId: contactId }),
    });
    const loan = await res.json();
    onChange([...loans, loan]);
    setShowAdd(false);
    setSaving(false);
  }

  async function handleEdit(id: string, form: LoanFormState) {
    setSaving(true);
    const res = await fetch(`/api/loans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const updated = await res.json();
    onChange(loans.map((l) => (l.id === id ? updated : l)));
    setEditingId(null);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this loan?")) return;
    await fetch(`/api/loans/${id}`, { method: "DELETE" });
    onChange(loans.filter((l) => l.id !== id));
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-gray-700">Loans</h2>
          {loans.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {loans.length} {loans.length === 1 ? "loan" : "loans"} · {fmt(total)} total
            </p>
          )}
        </div>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
          >
            + Add loan
          </button>
        )}
      </div>

      {loans.length === 0 && !showAdd && (
        <p className="text-sm text-gray-400">No loans yet.</p>
      )}

      {loans.map((loan) =>
        editingId === loan.id ? (
          <LoanForm
            key={loan.id}
            initial={{
              name: loan.name,
              loanAmount: String(loan.loanAmount),
              loanType: loan.loanType,
              targetRate: loan.targetRate != null ? String(loan.targetRate) : "",
              pricingRate: loan.pricingRate != null ? String(loan.pricingRate) : "",
              notes: loan.notes ?? "",
              expectedCloseDate: loan.expectedCloseDate ? loan.expectedCloseDate.split("T")[0] : "",
            }}
            onSave={(form) => handleEdit(loan.id, form)}
            onCancel={() => setEditingId(null)}
            saving={saving}
          />
        ) : (
          <div key={loan.id} className="border border-gray-100 rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-black">{loan.name}</p>
                  {onStageChange ? (
                    <select
                      value={stage ?? ""}
                      onChange={(e) => onStageChange(e.target.value || null)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs border border-gray-200 rounded px-2 py-0.5 bg-white text-gray-600 focus:outline-none focus:border-gray-400"
                    >
                      <option value="">No stage</option>
                      {PIPELINE_STAGES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : stage ? (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {stage}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-gray-400">{loan.loanType}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium text-black">{fmt(loan.loanAmount)}</p>
              </div>
            </div>

            {(loan.targetRate != null || loan.pricingRate != null) && (
              <div className="flex gap-4 text-xs text-gray-500">
                {loan.targetRate != null && (
                  <span>Target: <span className="font-medium text-gray-700">{fmtRate(loan.targetRate)}</span></span>
                )}
                {loan.pricingRate != null && (
                  <span>My pricing: <span className="font-medium text-gray-700">{fmtRate(loan.pricingRate)}</span></span>
                )}
              </div>
            )}

            {loan.expectedCloseDate && (
              <p className="text-xs text-gray-400">
                Close: <span className="text-gray-600">{new Date(loan.expectedCloseDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </p>
            )}
            {loan.notes && (
              <p className="text-xs text-gray-500 leading-relaxed">{loan.notes}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditingId(loan.id)}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(loan.id)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )
      )}

      {showAdd && (
        <LoanForm
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
          saving={saving}
        />
      )}
    </div>
  );
}
