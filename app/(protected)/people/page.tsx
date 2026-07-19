"use client";

import { useEffect, useState, useCallback, useMemo, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AddPersonModal from "@/components/AddPersonModal";
import PipelineValueChart from "@/components/PipelineValueChart";
import PartnerDemographicsChart from "@/components/PartnerDemographicsChart";

const STAGES = ["New Lead", "Pre-Qualified", "Application", "Processing", "Underwriting", "Closing", "Funded"];

type SortBy = "pipeline" | "tag" | "name";

interface Person {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  tags: string[];
  stage: string | null;
  loanAmount: number | null;
  lastContactedAt: string | null;
  _count: { notes: number };
}

function daysSince(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function primaryTag(person: Person): string {
  return person.tags[0] ?? "Untagged";
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("pipeline");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const fetchAllPeople = useCallback(async () => {
    const res = await fetch("/api/people");
    setAllPeople(await res.json());
  }, []);

  const fetchPeople = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (tagFilter) params.set("tag", tagFilter);
    if (stageFilter) params.set("stage", stageFilter);
    const res = await fetch(`/api/people?${params}`);
    setPeople(await res.json());
    setLoading(false);
  }, [search, tagFilter, stageFilter]);

  useEffect(() => { fetchPeople(); }, [fetchPeople]);
  useEffect(() => { fetchAllPeople(); }, [fetchAllPeople]);

  useEffect(() => {
    fetch("/api/tags?type=tags").then((r) => r.json()).then(setAllTags);
  }, []);

  function handleCreated(person: { id: string; name: string }) {
    setShowModal(false);
    fetchAllPeople();
    router.push(`/people/${person.id}`);
  }

  const sortedPeople = useMemo(() => {
    if (sortBy === "pipeline") {
      const pipeline = people.filter((p) => p.stage).sort((a, b) => a.name.localeCompare(b.name));
      const rest = people.filter((p) => !p.stage).sort((a, b) => a.name.localeCompare(b.name));
      return [...pipeline, ...rest];
    }
    if (sortBy === "tag") {
      return [...people].sort((a, b) => {
        const ta = primaryTag(a);
        const tb = primaryTag(b);
        if (ta === "Untagged" && tb !== "Untagged") return 1;
        if (tb === "Untagged" && ta !== "Untagged") return -1;
        return ta !== tb ? ta.localeCompare(tb) : a.name.localeCompare(b.name);
      });
    }
    return [...people].sort((a, b) => a.name.localeCompare(b.name));
  }, [people, sortBy]);

  // divider index for pipeline sort: where pipeline ends
  const pipelineDividerIndex = sortBy === "pipeline"
    ? sortedPeople.findIndex((p) => !p.stage)
    : -1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-black">People</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {allPeople.length} {allPeople.length === 1 ? "person" : "people"}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white text-sm px-4 py-2 rounded hover:bg-gray-900 transition-colors"
        >
          Add person
        </button>
      </div>

      {allPeople.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PipelineValueChart contacts={allPeople} />
          <PartnerDemographicsChart people={allPeople} />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name"
          className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 w-52"
        />
        {allTags.length > 0 && (
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 bg-white text-gray-700"
          >
            <option value="">All tags</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 bg-white text-gray-700"
        >
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 bg-white text-gray-700"
        >
          <option value="pipeline">Pipeline first</option>
          <option value="tag">Group by tag</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
        ) : sortedPeople.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-400">
              {search || tagFilter || stageFilter ? "No people match your filters." : "No people yet. Add your first one."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Name</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden sm:table-cell">Role</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden md:table-cell">Tags</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">Phone</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden xl:table-cell">Last contact</th>
              </tr>
            </thead>
            <tbody>
              {sortedPeople.map((person, i) => {
                const prevTag = i > 0 ? primaryTag(sortedPeople[i - 1]) : null;
                const curTag = primaryTag(person);
                const showTagHeader = sortBy === "tag" && curTag !== prevTag;
                const showPipelineDivider = sortBy === "pipeline" && i === pipelineDividerIndex && pipelineDividerIndex > 0;

                return (
                  <Fragment key={person.id}>
                    {showTagHeader && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-t border-gray-100"
                        >
                          {curTag}
                        </td>
                      </tr>
                    )}
                    {showPipelineDivider && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-t border-gray-100"
                        >
                          Everyone else
                        </td>
                      </tr>
                    )}
                    <tr
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${i < sortedPeople.length - 1 ? "border-b border-gray-100" : ""}`}
                      onClick={() => router.push(`/people/${person.id}`)}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/people/${person.id}`}
                          className="text-sm font-medium text-black hover:underline underline-offset-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {person.name}
                        </Link>
                        {person.stage && (
                          <p className="text-xs text-gray-400 mt-0.5">{person.stage}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                        {person.role ?? <span className="text-gray-300">No role</span>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {person.tags.length > 0
                            ? person.tags.map((t) => (
                                <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
                              ))
                            : <span className="text-sm text-gray-300">None</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                        {person.phone ?? <span className="text-gray-300">No phone</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden xl:table-cell">
                        {person.lastContactedAt ? daysSince(person.lastContactedAt) : <span className="text-gray-300">Never</span>}
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <AddPersonModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
