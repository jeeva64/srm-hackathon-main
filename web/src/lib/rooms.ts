/**
 * rooms.ts — deterministic, timetable-based room availability (Round 2 · Phase 1).
 *
 * Source: data/rooms.json, generated from the same verified timetables as the attendance app.
 * A room is OCCUPIED at time t if any of the 13 sections has a class there with start <= t < end.
 * Everything else is AVAILABLE. Back-to-back classes are merged into one busy block.
 *
 * The output type RoomAvailability is deliberately rich enough for a later visual map /
 * countdown (nextClassStart, availableUntil, occupiedUntil) — but nothing here is a timer.
 */
import { weekdayOf, SEMESTER_START, SEMESTER_END, type Weekday } from "./calendar";

// ---------------------------------------------------------------- data types
export interface Room {
  id: string;               // stable identifier, e.g. "IST-509". Never use the display label as identity.
  room: string;             // display label, e.g. "IST 509"
  building: string;         // "IST" | "TB"
  floor: string;            // "Ground" | "1" | "2" | ...  — the only floor encoding used anywhere
  floorInferred: boolean;   // true when the floor was inferred (2-digit room numbers -> Ground)
  kind: "classroom" | "lab" | "mixed";
  usedBy: string[];         // section ids that have classes in this room
  ac: boolean | null;       // null = unknown (the timetables contain no AC data)
  capacity: number | null;  // null = unknown
}

export interface Occupancy {
  roomId: string;
  day: Weekday;
  start: string;            // "HH:MM"
  end: string;
  section: string;
  subjectCode: string;
  subjectName: string;
  classType: string;
  source: "timetable-cell" | "home-venue";
  confidence: "high" | "medium" | "low";
  currentTimetable: boolean; // false = from the 2024-25 I-year PDF
}

export interface RoomsData {
  meta: { floorRule: string; roomRule: string; acAndCapacity: string; scope: string; unknownRoomSlots: number; conflicts: unknown[] };
  rooms: Room[];
  occupancy: Occupancy[];
}

export interface CurrentClass { section: string; subjectCode: string; subjectName: string; start: string; end: string }

/** Phase-2-compatible availability record. */
export interface RoomAvailability {
  id: string;
  room: string;
  floor: string;
  building: string;
  kind: Room["kind"];
  ac: boolean | null;
  capacity: number | null;
  status: "available" | "occupied";
  availableFrom?: string;       // available: the evaluated time (free from now)
  availableUntil?: string;      // available: start of the next class today; undefined = free for the rest of the day
  nextClassStart?: string;      // next class that STARTS after the evaluated time (after the current block if occupied)
  occupiedUntil?: string;       // occupied: when the current continuous busy block ends
  freeMinutes?: number | null;  // available: minutes until availableUntil; null = rest of the day
  currentClasses?: CurrentClass[]; // occupied: what's on right now (can be >1 for shared labs)
}

// ---------------------------------------------------------------- time helpers
export const toMin = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
export const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
export function localNowHHMM(now: Date = new Date()): string { return toHHMM(now.getHours() * 60 + now.getMinutes()); }
export function formatTime12(hhmm: string): string {
  const m = toMin(hhmm), h = Math.floor(m / 60), mm = m % 60;
  return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function isInstructionDay(dateISO: string): boolean {
  return dateISO >= SEMESTER_START && dateISO <= SEMESTER_END && weekdayOf(dateISO) !== null;
}

// ---------------------------------------------------------------- engine
interface Block { start: number; end: number; classes: Occupancy[] }

/** Busy blocks for one room on one weekday, sorted, with overlapping/touching classes merged. */
export function busyBlocks(data: RoomsData, roomId: string, day: Weekday): Block[] {
  const occ = data.occupancy.filter((o) => o.roomId === roomId && o.day === day)
    .sort((a, b) => toMin(a.start) - toMin(b.start));
  const blocks: Block[] = [];
  for (const o of occ) {
    const s = toMin(o.start), e = toMin(o.end), last = blocks[blocks.length - 1];
    if (last && s <= last.end) { last.end = Math.max(last.end, e); last.classes.push(o); }
    else blocks.push({ start: s, end: e, classes: [o] });
  }
  return blocks;
}

/** Availability of every known room at (dateISO, time). Outside instruction days every room is free. */
export function availabilityAt(data: RoomsData, dateISO: string, time: string): RoomAvailability[] {
  const t = toMin(time);
  const day = isInstructionDay(dateISO) ? weekdayOf(dateISO) : null;
  return data.rooms.map((r) => {
    const base = { id: r.id, room: r.room, floor: r.floor, building: r.building, kind: r.kind, ac: r.ac, capacity: r.capacity };
    const blocks = day ? busyBlocks(data, r.id, day) : [];
    const cur = blocks.find((b) => b.start <= t && t < b.end);
    if (cur) {
      const next = blocks.find((b) => b.start >= cur.end);
      return {
        ...base, status: "occupied" as const, occupiedUntil: toHHMM(cur.end),
        nextClassStart: next ? toHHMM(next.start) : undefined,
        currentClasses: cur.classes.filter((c) => toMin(c.start) <= t && t < toMin(c.end))
          .map((c) => ({ section: c.section, subjectCode: c.subjectCode, subjectName: c.subjectName, start: c.start, end: c.end })),
      };
    }
    const next = blocks.find((b) => b.start > t);
    return {
      ...base, status: "available" as const, availableFrom: toHHMM(t),
      availableUntil: next ? toHHMM(next.start) : undefined,
      nextClassStart: next ? toHHMM(next.start) : undefined,
      freeMinutes: next ? next.start - t : null,
    };
  });
}

/** Stable floor order: Ground, 1, 2, ... */
export function floorOrder(f: string): number { return f === "Ground" ? 0 : Number(f) || 99; }
export function floorLabel(f: string): string {
  if (f === "Ground") return "Ground floor";
  const n = Number(f), sfx = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
  return `${n}${sfx} floor`;
}

export function groupByFloor<T extends { floor: string; id: string }>(items: T[]): { floor: string; label: string; rooms: T[] }[] {
  const map = new Map<string, T[]>();
  for (const i of items) map.set(i.floor, [...(map.get(i.floor) ?? []), i]);
  return [...map.entries()].sort((a, b) => floorOrder(a[0]) - floorOrder(b[0]))
    .map(([floor, rooms]) => ({ floor, label: floorLabel(floor), rooms: rooms.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })) }));
}

export function floors(data: RoomsData): string[] {
  return [...new Set(data.rooms.map((r) => r.floor))].sort((a, b) => floorOrder(a) - floorOrder(b));
}

// ---------------------------------------------------------------- search
export interface RoomQuery {
  date?: string | null;            // ISO date; default today
  startTime?: string | null;       // "HH:MM"; default now
  durationMinutes?: number | null; // must be free for this long from startTime; default: just free at startTime
  floor?: string | null;           // "Ground" | "1" | ...
  kind?: "classroom" | "lab" | null;
  building?: string | null;        // "IST" | "TB"
  ac?: boolean | null;
  groupSize?: number | null;
}

export interface SearchResult {
  date: string;
  time: string;
  durationMinutes: number | null;
  isInstructionDay: boolean;
  matches: RoomAvailability[];     // sorted: longest free window first, then floor, then room
  notes: string[];                 // honest caveats to show the user (e.g. AC data unavailable)
}

export function findRooms(data: RoomsData, q: RoomQuery, today: string, now: string): SearchResult {
  const date = q.date ?? today;
  const time = q.startTime ?? now;
  const dur = q.durationMinutes && q.durationMinutes > 0 ? Math.round(q.durationMinutes) : null;
  const notes: string[] = [];
  const instr = isInstructionDay(date);
  if (!instr) notes.push(date < SEMESTER_START || date > SEMESTER_END
    ? "That date is outside the semester (29 Aug – 29 Nov 2026), so no classes are scheduled."
    : "No classes are scheduled on weekends, so every room is free.");

  let list = availabilityAt(data, date, time).filter((a) => a.status === "available");
  if (dur !== null) list = list.filter((a) => a.freeMinutes === null || (a.freeMinutes ?? 0) >= dur);
  if (q.floor) list = list.filter((a) => a.floor === q.floor);
  if (q.building) list = list.filter((a) => a.building === q.building);
  if (q.kind) list = list.filter((a) => a.kind === q.kind || a.kind === "mixed");

  if (q.ac) {
    if (data.rooms.some((r) => r.ac !== null)) list = list.filter((a) => a.ac === true);
    else notes.push("The timetables don't say which rooms have AC, so AC couldn't be checked. Showing every room that matches the rest.");
  }
  if (q.groupSize) {
    if (data.rooms.some((r) => r.capacity !== null)) list = list.filter((a) => a.capacity === null || a.capacity >= q.groupSize!);
    else notes.push("Room capacity isn't in the timetables. These are all regular classrooms or labs, so a small team will fit.");
  }
  if (q.floor && !data.rooms.some((r) => r.floor === q.floor)) notes.push(`None of the timetables use a room on the ${floorLabel(q.floor).toLowerCase()}.`);
  if (q.floor === "Ground") notes.push("Ground-floor rooms (IST 20, IST 21) are inferred from their 2-digit numbers.");
  notes.push("“Free” means no class from the 10 timetables is scheduled there. Other departments may still use the room.");

  list.sort((a, b) => (b.freeMinutes ?? 1e9) - (a.freeMinutes ?? 1e9) || floorOrder(a.floor) - floorOrder(b.floor) || a.id.localeCompare(b.id, undefined, { numeric: true }));
  return { date, time, durationMinutes: dur, isInstructionDay: instr, matches: list, notes };
}
