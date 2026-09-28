/**
 * roomQuery.ts — turn a sentence into a RoomQuery.
 *
 * Two paths, SAME output type:
 *   1. AI path: an LLM (e.g. Gemini, called from a Next.js route handler so the API key stays
 *      on the server) returns JSON matching ROOM_QUERY_JSON_SCHEMA. Always pass its output
 *      through normalizeRoomQuery() — never trust raw model output.
 *   2. Fallback: parseRoomQuery() — a deterministic rule-based parser. Used when there is no
 *      API key, the call fails, or it times out. The app must work fully on this path.
 *
 * The LLM ONLY interprets the sentence. Which rooms are free is always decided by
 * findRooms() in rooms.ts from the timetable, so the AI can never invent a room.
 */
import type { RoomQuery } from "./rooms";
import { addDays } from "./calendar";

export interface ParsedQuery {
  query: RoomQuery;
  understood: string[];  // chips to show: "Ground floor", "Next 2 h", ...
  source: "ai" | "rules";
}

const WORD_NUM: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const ORD: Record<string, string> = { first: "1", second: "2", third: "3", fourth: "4", fifth: "5", sixth: "6", seventh: "7" };
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const hhmm = (h: number, m: number) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

/** Rule-based parser. `today` = ISO date, `now` = "HH:MM", both from the user's device. */
export function parseRoomQuery(text: string, today: string, now: string): ParsedQuery {
  const t = ` ${text.toLowerCase().replace(/[’']/g, "").replace(/\s+/g, " ")} `;
  const q: RoomQuery = {};
  const chips: string[] = [];

  // floor
  let m: RegExpMatchArray | null;
  if (/\bground\b|\bg ?floor\b/.test(t)) q.floor = "Ground";
  else if ((m = t.match(/\b(\d)(?:st|nd|rd|th)? ?floor\b/)) || (m = t.match(/\bfloor (?:no\.? ?)?(\d)\b/))) q.floor = m[1];
  else if ((m = t.match(/\b(first|second|third|fourth|fifth|sixth|seventh) floor\b/))) q.floor = ORD[m[1]];
  if (q.floor) chips.push(q.floor === "Ground" ? "Ground floor" : `Floor ${q.floor}`);

  // duration
  if (/\bhalf an? hour\b|\b30 ?min/.test(t)) q.durationMinutes = 30;
  else if ((m = t.match(/\b(\d+(?:\.\d+)?|an?|one|two|three|four|five|six)\s*(?:more\s*)?(hours?|hrs?|h)\b/))) q.durationMinutes = Math.round((WORD_NUM[m[1]] ?? Number(m[1])) * 60);
  else if ((m = t.match(/\b(\d+)\s*(minutes?|mins?|m)\b/))) q.durationMinutes = Number(m[1]);
  else if (/\ban hour\b/.test(t)) q.durationMinutes = 60;
  if (q.durationMinutes) chips.push(q.durationMinutes % 60 === 0 ? `${q.durationMinutes / 60} h` : `${q.durationMinutes} min`);

  // day
  if (/\btomorrow\b/.test(t)) { q.date = addDays(today, 1); chips.push("Tomorrow"); }
  else if (/\btoday\b|\bnow\b|\bright now\b/.test(t)) { /* default */ }
  else {
    const d = DAYS.find((d) => new RegExp(`\\b(on |this |next )?${d}\\b`).test(t));
    if (d) {
      let date = today;
      for (let i = 0; i < 7; i++) {
        const cand = addDays(today, i);
        if (new Date(cand + "T00:00:00Z").getUTCDay() === DAYS.indexOf(d)) { date = cand; break; }
      }
      q.date = date; chips.push(d[0].toUpperCase() + d.slice(1));
    }
  }

  // start time: "at 2", "at 2pm", "from 14:30", "by 10.30 am"
  if ((m = t.match(/\b(?:at|from|by|around|after)\s+(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\b/))) {
    let h = Number(m[1]); const min = Number(m[2] ?? 0); const ap = m[3]?.[0];
    if (ap === "p" && h < 12) h += 12;
    if (ap === "a" && h === 12) h = 0;
    if (!ap && h >= 1 && h <= 7) h += 12; // college hours: "at 2" means 2 PM
    if (h <= 23 && min <= 59) { q.startTime = hhmm(h, min); chips.push(`From ${q.startTime}`); }
  } else if (/\bafter lunch\b/.test(t)) { q.startTime = "13:30"; chips.push("From 13:30"); }
  else if (!q.date) chips.push(`From now (${now})`);

  // room type
  if (/\blab(oratory)?s?\b/.test(t)) { q.kind = "lab"; chips.push("Lab"); }
  else if (/\bclass ?rooms?\b|\blecture\b/.test(t)) { q.kind = "classroom"; chips.push("Classroom"); }

  // building
  if (/\btb\b|\btech ?block\b/.test(t)) { q.building = "TB"; chips.push("TB block"); }

  // AC
  if (/\ba\.?c\.?\b|\bair[- ]?condition/.test(t)) { q.ac = true; chips.push("AC"); }

  // group size
  if ((m = t.match(/\b(\d+)\s*(?:people|persons|students|of us|members|friends)\b/)) || (m = t.match(/\bteam of (\d+)\b/))) {
    q.groupSize = Number(m[1]); chips.push(`${q.groupSize} people`);
  } else if (/\bmy team\b|\bmy friends\b|\bgroup\b|\bsquad\b/.test(t)) chips.push("Group");

  return { query: q, understood: chips, source: "rules" };
}

// ---------------------------------------------------------------- AI path helpers
/** Standard JSON Schema for LLM structured output (Gemini responseJsonSchema / OpenAI json_schema / Claude tool input_schema). */
export const ROOM_QUERY_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    date: { type: ["string", "null"], description: "ISO date YYYY-MM-DD, or null for today" },
    startTime: { type: ["string", "null"], description: "24h HH:MM, or null for now" },
    durationMinutes: { type: ["integer", "null"], description: "How long the room must stay free, or null" },
    floor: { type: ["string", "null"], enum: ["Ground", "1", "2", "3", "4", "5", "6", "7", null], description: "null if not mentioned" },
    kind: { type: ["string", "null"], enum: ["classroom", "lab", null] },
    building: { type: ["string", "null"], enum: ["IST", "TB", null] },
    ac: { type: ["boolean", "null"], description: "true only if the user asked for AC / air conditioning" },
    groupSize: { type: ["integer", "null"], description: "Number of people, if stated" },
  },
  required: ["date", "startTime", "durationMinutes", "floor", "kind", "building", "ac", "groupSize"],
} as const;

export function roomQuerySystemPrompt(today: string, now: string, weekday: string | null): string {
  return [
    "You convert a student's request for an empty college room into JSON filters. Output only the JSON.",
    `Today is ${today} (${weekday ?? "weekend"}), the time now is ${now} (24h). Classes run 09:00–17:05, Monday to Friday.`,
    "Rules: 'next 2 hours' / 'for 2 hours' => durationMinutes 120 and startTime null. 'at 2' with no am/pm means 14:00.",
    "'tomorrow' => date = today + 1 day. A weekday name => the next such date (today counts).",
    "'ground floor' => floor 'Ground'. 'fifth floor' / '5th floor' => '5'. Leave any field null if the user didn't mention it.",
    "Never invent room numbers. You only produce filters.",
  ].join("\n");
}

/** Sanitise anything (LLM output, URL params) into a safe RoomQuery. Unknown or invalid values become null. */
export function normalizeRoomQuery(raw: unknown): RoomQuery {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const date = str(o.date);
  const time = str(o.startTime);
  const dur = typeof o.durationMinutes === "number" && Number.isFinite(o.durationMinutes) ? Math.round(o.durationMinutes) : null;
  const floorRaw = str(o.floor);
  const floor = floorRaw && /^(ground|g)$/i.test(floorRaw) ? "Ground" : floorRaw && /^[1-7]$/.test(floorRaw) ? floorRaw : null;
  const kind = o.kind === "lab" || o.kind === "classroom" ? o.kind : null;
  const building = o.building === "IST" || o.building === "TB" ? o.building : null;
  const gs = typeof o.groupSize === "number" && Number.isFinite(o.groupSize) && o.groupSize > 0 && o.groupSize < 500 ? Math.round(o.groupSize) : null;
  return {
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    startTime: time && /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : null,
    durationMinutes: dur && dur > 0 && dur <= 12 * 60 ? dur : null,
    floor, kind, building,
    ac: o.ac === true ? true : null,
    groupSize: gs,
  };
}

/** Chips for an AI-parsed query (same wording as the rule parser). */
export function describeQuery(q: RoomQuery, now: string): string[] {
  const c: string[] = [];
  if (q.floor) c.push(q.floor === "Ground" ? "Ground floor" : `Floor ${q.floor}`);
  if (q.durationMinutes) c.push(q.durationMinutes % 60 === 0 ? `${q.durationMinutes / 60} h` : `${q.durationMinutes} min`);
  if (q.date) c.push(q.date);
  c.push(q.startTime ? `From ${q.startTime}` : `From now (${now})`);
  if (q.kind) c.push(q.kind === "lab" ? "Lab" : "Classroom");
  if (q.building) c.push(`${q.building} block`);
  if (q.ac) c.push("AC");
  if (q.groupSize) c.push(`${q.groupSize} people`);
  return c;
}
