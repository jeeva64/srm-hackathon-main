"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Filter, Search, Sparkles } from "lucide-react";
import raw from "@/data/rooms.json";
import { useToday } from "@/lib/useToday";
import { floors, floorLabel, formatTime12, groupByFloor, availabilityAt, findRooms, localNowHHMM, type RoomQuery, type RoomsData, type RoomAvailability } from "@/lib/rooms";
import { parseRoomQuery } from "@/lib/roomQuery";
import { SEMESTER_END, SEMESTER_START } from "@/lib/calendar";

const data = raw as unknown as RoomsData;
const examples = [
  "I need a room on the ground floor for 2 hours",
  "free lab on the 5th floor at 2pm for 1 hour",
  "any classroom on floor 6 tomorrow at 10:30",
];

function RoomTile({ room }: { room: RoomAvailability }) {
  const available = room.status === "available";
  const soon = available && room.freeMinutes !== null && room.freeMinutes !== undefined && room.freeMinutes <= 15;
  return (
    <div className={`p-3 rounded-sm border ${available ? soon ? "bg-[#FF9130]/10 border-[#FF9130]/60" : "bg-[#6FA043]/10 border-[#6FA043]/40" : "bg-[#E33D2E]/10 border-[#E33D2E]/50"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono font-bold text-sm text-[#F1E9D2]">{room.room}</span>
        <span className="text-[10px] font-bold uppercase">{available ? soon ? "Soon busy" : "Free" : "Busy"}</span>
      </div>
      <p className="text-[11px] text-[#CFC6A9] mt-2">
        {available ? room.availableUntil ? `Free until ${formatTime12(room.availableUntil)}` : "Free rest of day" : `Busy until ${formatTime12(room.occupiedUntil ?? "17:00")}`}
      </p>
      {!available && room.currentClasses?.[0] && <p className="text-[10px] text-[#FFB35C] mt-1 truncate">{room.currentClasses[0].section} · {room.currentClasses[0].subjectCode}</p>}
      {available && soon && <p className="text-[10px] text-[#FFB35C] mt-1">Class at {formatTime12(room.nextClassStart ?? "")}</p>}
    </div>
  );
}

export default function RoomsPage() {
  const today = useToday();
  const date = today ?? SEMESTER_START;
  const now = localNowHHMM();
  const [time, setTime] = useState(now);
  const [query, setQuery] = useState<RoomQuery>({});
  const [floor, setFloor] = useState("");
  const [kind, setKind] = useState<"" | "classroom" | "lab">("");
  const [duration, setDuration] = useState("");
  const [searchText, setSearchText] = useState("");
  const [understood, setUnderstood] = useState<string[]>([]);
  const [source, setSource] = useState<"ai" | "rules" | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedDate = query.date ?? date;
  const activeQuery = { ...query, date: selectedDate, startTime: time, floor: floor || null, kind: kind || null, durationMinutes: duration ? Number(duration) : null };
  const result = findRooms(data, activeQuery, selectedDate, time);
  const grid = groupByFloor(availabilityAt(data, selectedDate, time).filter((room) => !floor || room.floor === floor));

  const applyParsed = (parsed: { query: RoomQuery; understood: string[]; source: "ai" | "rules"; reason?: string }) => {
    setQuery(parsed.query); setUnderstood(parsed.understood); setSource(parsed.source); setReason(parsed.reason ?? null);
    setFloor(parsed.query.floor ?? ""); setKind(parsed.query.kind ?? ""); setDuration(parsed.query.durationMinutes ? String(parsed.query.durationMinutes) : "");
    if (parsed.query.startTime) setTime(parsed.query.startTime);
  };

  const runSearch = async (text = searchText) => {
    if (!text.trim() || !today) return;
    setLoading(true); setSearchText(text);
    try {
      const response = await fetch("/api/room-query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, today, now: time }) });
      if (!response.ok) throw new Error("Search unavailable");
      applyParsed(await response.json());
    } catch {
      applyParsed(parseRoomQuery(text, today, time));
    } finally { setLoading(false); }
  };

  const reset = () => { setQuery({}); setFloor(""); setKind(""); setDuration(""); setUnderstood([]); setSource(null); setReason(null); setSearchText(""); setTime(localNowHHMM()); };
  const handleFloor = (value: string) => { setFloor(value); setQuery((current) => ({ ...current, floor: value || null })); };
  const matches = result.matches.slice(0, 8);

  return (
    <main className="max-w-[1200px] mx-auto px-4 py-7 sm:py-10 space-y-7">
      <header className="space-y-3">
        <p className="eyebrow">Round 2 · Phase 1</p>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div><h1 className="font-['Press_Start_2P'] text-xl sm:text-3xl text-[#F1E9D2] leading-tight">ROOM FINDER</h1><p className="text-sm text-[#CFC6A9] mt-3 max-w-2xl">Find a timetable-verified room that is free at the time you need it.</p></div>
          <Link href="/planner" className="text-sm text-[#FFB35C] hover:text-[#F1E9D2] inline-flex items-center gap-2">Back to planner <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </header>

      <section className="soft-panel p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#FF9130]" /><h2 className="font-bold text-[#F1E9D2]">Describe the room you need</h2></div>
        <form onSubmit={(event) => { event.preventDefault(); void runSearch(); }} className="flex flex-col sm:flex-row gap-2">
          <label htmlFor="room-search" className="sr-only">Describe your room request</label>
          <input id="room-search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Try: I need a room on the 5th floor for 2 hours" className="min-w-0 flex-1 bg-[#0B0E1F] text-[#F1E9D2] border border-[rgba(241,233,210,0.2)] rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-[#FF9130]" />
          <button type="submit" disabled={loading} className="btn-block rounded-sm inline-flex items-center justify-center gap-2"><Search className="w-4 h-4" />{loading ? "Reading..." : "Search"}</button>
        </form>
        <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1">{examples.map((example) => <button type="button" key={example} onClick={() => { setSearchText(example); void runSearch(example); }} className="shrink-0 text-[11px] text-[#CFC6A9] border border-[rgba(241,233,210,0.15)] rounded-sm px-2.5 py-2 hover:border-[#FF9130]">{example}</button>)}</div>
        {understood.length > 0 && <div className="flex flex-wrap items-center gap-2 text-xs"><span className="text-[#CFC6A9]">Understood as:</span>{understood.map((item) => <span key={item} className="px-2 py-1 rounded-sm bg-[#1C2448] text-[#FFB35C]">{item}</span>)}<span className="text-[10px] text-[#6FA043]">{source === "ai" ? "AI" : "Quick parser"}</span>{source === "rules" && (reason === "ai_busy" || reason === "timeout") && <span className="basis-full text-[11px] text-[#CFC6A9]">AI is busy right now — used the built-in parser.</span>}</div>}
      </section>

      <section className="soft-panel p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Filter className="w-4 h-4 text-[#FF9130]" /><h2 className="font-bold text-[#F1E9D2]">Search filters</h2></div><button type="button" onClick={reset} className="text-xs text-[#CFC6A9] underline underline-offset-2">Reset</button></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <label className="text-xs text-[#CFC6A9]">Date<input type="date" min={SEMESTER_START} max={SEMESTER_END} value={selectedDate} onChange={(event) => setQuery((current) => ({ ...current, date: event.target.value }))} className="mt-1 w-full bg-[#1C2448] text-[#F1E9D2] border border-[rgba(241,233,210,0.2)] rounded-sm px-2 py-2 font-mono" /></label>
          <label className="text-xs text-[#CFC6A9]">Time<div className="flex gap-1 mt-1"><input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="min-w-0 w-full bg-[#1C2448] text-[#F1E9D2] border border-[rgba(241,233,210,0.2)] rounded-sm px-2 py-2 font-mono" /><button type="button" onClick={() => setTime(localNowHHMM())} className="px-2 bg-[#FF9130] text-[#1B140C] rounded-sm">Now</button></div></label>
          <label className="text-xs text-[#CFC6A9]">Floor<select value={floor} onChange={(event) => handleFloor(event.target.value)} className="mt-1 w-full bg-[#1C2448] text-[#F1E9D2] border border-[rgba(241,233,210,0.2)] rounded-sm px-2 py-2"><option value="">All floors</option>{floors(data).map((item) => <option key={item} value={item}>{floorLabel(item)}</option>)}</select></label>
          <label className="text-xs text-[#CFC6A9]">Free for<select value={duration} onChange={(event) => setDuration(event.target.value)} className="mt-1 w-full bg-[#1C2448] text-[#F1E9D2] border border-[rgba(241,233,210,0.2)] rounded-sm px-2 py-2"><option value="">Any duration</option><option value="30">30 min</option><option value="60">1 hour</option><option value="120">2 hours</option><option value="180">3 hours</option></select></label>
          <label className="text-xs text-[#CFC6A9]">Type<select value={kind} onChange={(event) => setKind(event.target.value as "" | "classroom" | "lab")} className="mt-1 w-full bg-[#1C2448] text-[#F1E9D2] border border-[rgba(241,233,210,0.2)] rounded-sm px-2 py-2"><option value="">All types</option><option value="classroom">Classroom</option><option value="lab">Lab</option></select></label>
        </div>
      </section>

      {!result.isInstructionDay && <div className="p-3 rounded-sm border border-[#FF9130]/50 bg-[#FF9130]/10 text-sm text-[#FFB35C]">No scheduled classes on this date. Every known room is free according to the timetables.</div>}
      <section className="space-y-3"><div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Best matches</p><h2 className="section-title mt-1">{matches.length} rooms available</h2></div><span className="text-xs text-[#CFC6A9] inline-flex items-center gap-1"><Clock3 className="w-3 h-3" />{formatTime12(time)}</span></div>{matches.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{matches.map((room) => <RoomTile room={room} key={room.id} />)}</div>}{matches.length === 0 && <div className="soft-panel p-5 text-sm text-[#CFC6A9]">No rooms match. Try a shorter time or another floor.</div>}{(result.notes.length > 0 || understood.includes("Group")) && <div className="space-y-1 text-[11px] text-[#CFC6A9]">{result.notes.map((note) => <p key={note}>• {note}</p>)}{understood.includes("Group") && !result.notes.some((note) => note.toLowerCase().includes("capacity")) && <p>• Room capacity is not recorded in the timetables, so group fit cannot be verified.</p>}</div>}</section>

      <section className="space-y-4"><div><p className="eyebrow">Live floor view</p><h2 className="section-title mt-1">Rooms at {formatTime12(time)}</h2><p className="text-xs text-[#CFC6A9] mt-1">Showing rooms at {time}, {selectedDate}</p></div>{grid.map((group) => <div key={group.floor} className="space-y-2"><div className="flex items-center justify-between"><h3 className="font-bold text-[#F1E9D2]">{group.label}</h3><span className="text-xs text-[#CFC6A9]">{group.rooms.filter((room) => room.status === "available").length} of {group.rooms.length} free</span></div><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">{group.rooms.map((room) => <RoomTile room={room} key={room.id} />)}</div></div>)}</section>
    </main>
  );
}
