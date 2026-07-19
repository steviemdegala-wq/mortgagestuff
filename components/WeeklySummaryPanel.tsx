"use client";

import { useState, useEffect, useRef } from "react";
import AddPersonModal from "@/components/AddPersonModal";

interface PartnerSuggestion {
  id: string;
  name: string;
  role: string | null;
}

interface FaceToFaceMeeting {
  id: string;
  contactName: string;
  date: string;
}

interface NetworkingEvent {
  id: string;
  eventName: string;
  date: string;
}

interface WeeklySummary {
  followUps: number;
  newLeads: number;
  creditPulls: number;
  exerciseSessions: number;
  exerciseMinutes: number;
  readingMinutes: number;
  faceToFaceMeetings: FaceToFaceMeeting[];
  faceToFaceCount: number;
  faceToFaceGoal: number;
}

function todayDateStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function WeeklySummaryPanel() {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [events, setEvents] = useState<NetworkingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [newMeetingName, setNewMeetingName] = useState("");
  const [newMeetingDate, setNewMeetingDate] = useState(todayDateStr());
  const [addingMeeting, setAddingMeeting] = useState(false);
  const [meetingSuggestions, setMeetingSuggestions] = useState<PartnerSuggestion[]>([]);
  const [showMeetingSuggestions, setShowMeetingSuggestions] = useState(false);
  const meetingSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const meetingInputRef = useRef<HTMLDivElement>(null);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);

  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState(todayDateStr());
  const [addingEvent, setAddingEvent] = useState(false);

  function load() {
    Promise.all([
      fetch("/api/tlop/weekly-summary").then((r) => r.json()),
      fetch("/api/networking-events").then((r) => r.json()),
    ]).then(([s, e]) => {
      setSummary(s);
      setEvents(e);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function handleMeetingNameChange(v: string) {
    setNewMeetingName(v);
    if (meetingSearchTimer.current) clearTimeout(meetingSearchTimer.current);
    if (!v.trim()) {
      setMeetingSuggestions([]);
      setShowMeetingSuggestions(false);
      return;
    }
    setShowMeetingSuggestions(true);
    meetingSearchTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/people/search?q=${encodeURIComponent(v)}`);
      const data: PartnerSuggestion[] = await res.json();
      setMeetingSuggestions(data);
    }, 200);
  }

  async function handleAddMeeting() {
    if (!newMeetingName.trim() || !newMeetingDate) return;
    setAddingMeeting(true);
    setShowMeetingSuggestions(false);
    try {
      await fetch("/api/face-to-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactName: newMeetingName.trim(), date: newMeetingDate }),
      });
      setNewMeetingName("");
      load();
    } finally {
      setAddingMeeting(false);
    }
  }

  async function handleRemoveMeeting(id: string) {
    await fetch(`/api/face-to-face?id=${id}`, { method: "DELETE" });
    load();
  }

  async function handleAddEvent() {
    if (!newEventName.trim() || !newEventDate) return;
    setAddingEvent(true);
    try {
      await fetch("/api/networking-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventName: newEventName.trim(), date: newEventDate }),
      });
      setNewEventName("");
      load();
    } finally {
      setAddingEvent(false);
    }
  }

  async function handleRemoveEvent(id: string) {
    await fetch(`/api/networking-events?id=${id}`, { method: "DELETE" });
    load();
  }

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-6">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  const s = summary;

  return (
    <>
    <div className="border border-gray-200 rounded-lg p-6 space-y-6">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
        Weekly Summary
      </h2>

      {/* Weekly Totals */}
      {s && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Totals This Week
          </p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Follow-ups</span>
              <span className="font-medium text-black">{s.followUps}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">New Leads</span>
              <span className="font-medium text-black">{s.newLeads}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Credit Pulls</span>
              <span className="font-medium text-black">{s.creditPulls}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Workouts</span>
              <span className="font-medium text-black">{s.exerciseSessions} / 4</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Exercise (min)</span>
              <span className="font-medium text-black">{s.exerciseMinutes}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Reading (min)</span>
              <span className="font-medium text-black">{s.readingMinutes}</span>
            </div>
          </div>
        </div>
      )}

      {/* Face to Face Meetings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Face to Face Meetings
          </p>
          <span className="text-xs text-gray-400">
            {s?.faceToFaceCount ?? 0} / {s?.faceToFaceGoal ?? 3} this week
          </span>
        </div>
        {s && s.faceToFaceMeetings.length > 0 && (
          <div className="space-y-1 mb-3">
            {s.faceToFaceMeetings.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-gray-700">{m.contactName}</span>
                  <span className="text-xs text-gray-400">{formatDate(m.date)}</span>
                </div>
                <button
                  onClick={() => handleRemoveMeeting(m.id)}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <div ref={meetingInputRef} className="relative flex-1">
            <input
              type="text"
              placeholder="Contact name"
              value={newMeetingName}
              onChange={(e) => handleMeetingNameChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowMeetingSuggestions(false), 150)}
              onKeyDown={(e) => e.key === "Enter" && handleAddMeeting()}
              className="w-full text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
            />
            {showMeetingSuggestions && (meetingSuggestions.length > 0 || newMeetingName.trim()) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-sm z-10 overflow-hidden">
                {meetingSuggestions.map((p) => (
                  <button
                    key={p.id}
                    onMouseDown={() => {
                      setNewMeetingName(p.name);
                      setShowMeetingSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-baseline gap-2"
                  >
                    <span className="font-medium text-black">{p.name}</span>
                    {p.role && <span className="text-xs text-gray-400">{p.role}</span>}
                  </button>
                ))}
                {newMeetingName.trim() && (
                  <button
                    onMouseDown={() => {
                      setShowMeetingSuggestions(false);
                      setShowAddPersonModal(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100 text-gray-500"
                  >
                    <span className="text-base leading-none">+</span>
                    <span>Add &ldquo;{newMeetingName.trim()}&rdquo; as new person</span>
                  </button>
                )}
              </div>
            )}
          </div>
          <input
            type="date"
            value={newMeetingDate}
            onChange={(e) => setNewMeetingDate(e.target.value)}
            className="text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-gray-400"
          />
          <button
            onClick={handleAddMeeting}
            disabled={addingMeeting || !newMeetingName.trim()}
            className="text-xs px-3 py-1.5 bg-black text-white rounded hover:bg-gray-900 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Networking Events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Networking Events
          </p>
          <span className="text-xs text-gray-400">
            {events.length} / 2 this month
          </span>
        </div>
        {events.length > 0 && (
          <div className="space-y-1 mb-3">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-gray-700">{ev.eventName}</span>
                  <span className="text-xs text-gray-400">{formatDate(ev.date)}</span>
                </div>
                <button
                  onClick={() => handleRemoveEvent(ev.id)}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Event name"
            value={newEventName}
            onChange={(e) => setNewEventName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddEvent()}
            className="flex-1 text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
          />
          <input
            type="date"
            value={newEventDate}
            onChange={(e) => setNewEventDate(e.target.value)}
            className="text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-gray-400"
          />
          <button
            onClick={handleAddEvent}
            disabled={addingEvent || !newEventName.trim()}
            className="text-xs px-3 py-1.5 bg-black text-white rounded hover:bg-gray-900 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>

    {showAddPersonModal && (
      <AddPersonModal
        initialName={newMeetingName.trim()}
        onClose={() => setShowAddPersonModal(false)}
        onCreated={(person) => {
          setShowAddPersonModal(false);
          setNewMeetingName(person.name);
        }}
      />
    )}
    </>
  );
}
