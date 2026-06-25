"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AddPartnerModal from "@/components/AddPartnerModal";

interface Partner {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  markets: string[];
  specializations: string[];
  _count: { notes: number };
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [marketFilter, setMarketFilter] = useState("");
  const [specFilter, setSpecFilter] = useState("");
  const [allMarkets, setAllMarkets] = useState<string[]>([]);
  const [allSpecs, setAllSpecs] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const fetchPartners = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (marketFilter) params.set("market", marketFilter);
    if (specFilter) params.set("spec", specFilter);

    const res = await fetch(`/api/partners?${params}`);
    const data = await res.json();
    setPartners(data);
    setLoading(false);
  }, [search, marketFilter, specFilter]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  useEffect(() => {
    Promise.all([
      fetch("/api/tags?type=markets").then((r) => r.json()),
      fetch("/api/tags?type=specializations").then((r) => r.json()),
    ]).then(([markets, specs]) => {
      setAllMarkets(markets);
      setAllSpecs(specs);
    });
  }, []);

  function handleCreated(partner: { id: string }) {
    setShowModal(false);
    router.push(`/partners/${partner.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-black">Referral Partners</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {partners.length} {partners.length === 1 ? "partner" : "partners"}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white text-sm px-4 py-2 rounded hover:bg-gray-900 transition-colors"
        >
          Add partner
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name"
          className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 w-52"
        />
        {allMarkets.length > 0 && (
          <select
            value={marketFilter}
            onChange={(e) => setMarketFilter(e.target.value)}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 bg-white text-gray-700"
          >
            <option value="">All markets</option>
            {allMarkets.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
        {allSpecs.length > 0 && (
          <select
            value={specFilter}
            onChange={(e) => setSpecFilter(e.target.value)}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 bg-white text-gray-700"
          >
            <option value="">All specializations</option>
            {allSpecs.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
        ) : partners.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-400">
              {search || marketFilter || specFilter
                ? "No partners match your filters."
                : "No partners yet. Add your first one."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden sm:table-cell">
                  Role
                </th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden md:table-cell">
                  Markets
                </th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">
                  Phone
                </th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner, i) => (
                <tr
                  key={partner.id}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    i < partners.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                  onClick={() => router.push(`/partners/${partner.id}`)}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/partners/${partner.id}`}
                      className="text-sm font-medium text-black hover:underline underline-offset-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {partner.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                    {partner.role ?? <span className="text-gray-300">No role</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {partner.markets.length > 0
                        ? partner.markets.map((m) => (
                            <span
                              key={m}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                            >
                              {m}
                            </span>
                          ))
                        : <span className="text-sm text-gray-300">None</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                    {partner.phone ?? <span className="text-gray-300">No phone</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <AddPartnerModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
