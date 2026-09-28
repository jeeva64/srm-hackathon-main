// Run: npx tsx --test tests/rooms.test.ts   (in web/: change ..\\src\\lib\\ -> ../src/lib/ and ..\\src\\data\\ -> ../src/data/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { availabilityAt, findRooms, busyBlocks, groupByFloor, floors, toMin, type RoomsData } from "..\\src\\lib\\rooms";
import { parseRoomQuery, normalizeRoomQuery } from "..\\src\\lib\\roomQuery";

const data: RoomsData = JSON.parse(readFileSync(new URL("..\\src\\data\\rooms.json", import.meta.url), "utf8"));
const MON = "2026-09-28", SAT = "2026-10-03";

test("room ids are stable, unique and floors use one encoding", () => {
  const ids = data.rooms.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const r of data.rooms) {
    assert.match(r.id, /^(IST|TB)-\d{2,3}$/);
    assert.match(r.floor, /^(Ground|[1-7])$/);
    assert.equal(r.room, r.id.replace("-", " "));
  }
  assert.deepEqual(floors(data), ["Ground", "1", "2", "3", "4", "5", "6", "7"]);
});

test("FN/AN shared room IST 518 never double-books between III-ECE-A and III-ECE-B", () => {
  for (const day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const) {
    const occ = data.occupancy.filter((o) => o.roomId === "IST-518" && o.day === day);
    for (const a of occ) for (const b of occ)
      if (a !== b && a.section !== b.section) assert.ok(toMin(a.end) <= toMin(b.start) || toMin(b.end) <= toMin(a.start), `${day} ${a.start} ${b.start}`);
  }
});

test("back-to-back classes merge into one busy block", () => {
  const b = busyBlocks(data, "IST-518", "Monday");
  assert.equal(b[0].start, toMin("09:00"));
  assert.equal(b[0].end, toMin("10:40")); // 09:00-09:50 + 09:50-10:40
});

test("occupied room reports when it frees up and the next class", () => {
  const r = availabilityAt(data, MON, "10:00").find((x) => x.id === "IST-518")!;
  assert.equal(r.status, "occupied");
  assert.equal(r.occupiedUntil, "10:40");
  assert.equal(r.nextClassStart, "10:50");
  assert.ok(r.currentClasses && r.currentClasses.length >= 1);
});

test("available room reports the end of its continuous free interval", () => {
  const r = availabilityAt(data, MON, "10:42").find((x) => x.id === "IST-518")!;
  assert.equal(r.status, "available");
  assert.equal(r.availableFrom, "10:42");
  assert.equal(r.availableUntil, "10:50");
  assert.equal(r.nextClassStart, "10:50");
  assert.equal(r.freeMinutes, 8);
});

test("a class ending exactly at t does not occupy the room; one starting at t does", () => {
  const at = availabilityAt(data, MON, "10:40").find((x) => x.id === "IST-518")!;
  assert.equal(at.status, "available");
  const st = availabilityAt(data, MON, "10:50").find((x) => x.id === "IST-518")!;
  assert.equal(st.status, "occupied");
});

test("weekends, and dates outside the semester, have every room free", () => {
  for (const d of [SAT, "2026-12-01", "2026-08-20"]) {
    const a = availabilityAt(data, d, "11:00");
    assert.ok(a.every((x) => x.status === "available" && x.availableUntil === undefined), d);
  }
  assert.ok(findRooms(data, {}, SAT, "11:00").notes[0].includes("weekends"));
});

test("groupByFloor is ordered Ground, 1, 2 … and covers every room once", () => {
  const g = groupByFloor(availabilityAt(data, MON, "11:00"));
  assert.equal(g[0].floor, "Ground");
  assert.equal(g.reduce((s, x) => s + x.rooms.length, 0), data.rooms.length);
});

test("organiser example: AC room, ground floor, team, next 2 hours", () => {
  const p = parseRoomQuery("I need an AC room on the ground floor for me and my team for the next 2 hours", MON, "10:00");
  assert.equal(p.query.floor, "Ground");
  assert.equal(p.query.durationMinutes, 120);
  assert.equal(p.query.ac, true);
  const r = findRooms(data, p.query, MON, "10:00");
  assert.deepEqual(r.matches.map((m) => m.id).sort(), ["IST-20", "IST-21"]);
  assert.ok(r.notes.some((n) => n.includes("AC")));
});

test("duration filter excludes rooms that get busy too soon", () => {
  const r = findRooms(data, { durationMinutes: 60 }, MON, "10:00");
  assert.ok(r.matches.every((m) => m.freeMinutes === null || (m.freeMinutes ?? 0) >= 60));
  assert.ok(!r.matches.some((m) => m.id === "IST-107")); // busy again at 10:50
});

test("parser: times, days, units, floors, room types", () => {
  const p1 = parseRoomQuery("free lab on the 5th floor at 2pm for 1 hour", MON, "10:00").query;
  assert.deepEqual([p1.floor, p1.kind, p1.startTime, p1.durationMinutes], ["5", "lab", "14:00", 60]);
  const p2 = parseRoomQuery("any classroom on floor 6 tomorrow at 10:30 for 45 minutes", MON, "10:00").query;
  assert.deepEqual([p2.floor, p2.date, p2.startTime, p2.durationMinutes], ["6", "2026-09-29", "10:30", 45]);
  const p3 = parseRoomQuery("room for 5 people on friday after lunch for half an hour", MON, "10:00").query;
  assert.deepEqual([p3.groupSize, p3.date, p3.startTime, p3.durationMinutes], [5, "2026-10-02", "13:30", 30]);
  const p4 = parseRoomQuery("sixth floor room from 11.40 am for 2 hrs", MON, "10:00").query;
  assert.deepEqual([p4.floor, p4.startTime, p4.durationMinutes], ["6", "11:40", 120]);
  assert.equal(parseRoomQuery("at 2", MON, "10:00").query.startTime, "14:00");
  assert.deepEqual(parseRoomQuery("empty room now", MON, "10:00").query, {});
});

test("normalizeRoomQuery rejects junk from an LLM", () => {
  assert.deepEqual(normalizeRoomQuery({ floor: "9", startTime: "25:00", durationMinutes: -5, kind: "gym", ac: "yes", groupSize: 9999, date: "tomorrow" }),
    { date: null, startTime: null, durationMinutes: null, floor: null, kind: null, building: null, ac: null, groupSize: null });
  assert.deepEqual(normalizeRoomQuery({ floor: "ground", startTime: "14:30", durationMinutes: 90, kind: "lab", ac: true, groupSize: 4, date: "2026-09-29" }),
    { date: "2026-09-29", startTime: "14:30", durationMinutes: 90, floor: "Ground", kind: "lab", building: null, ac: true, groupSize: 4 });
  assert.deepEqual(normalizeRoomQuery(null).floor, null);
});

test("no NaN/undefined leaks into the serialised availability", () => {
  for (const t of ["08:00", "09:00", "12:40", "13:25", "17:30", "23:59"]) {
    const s = JSON.stringify(availabilityAt(data, MON, t));
    assert.ok(!s.includes("NaN") && !s.includes("null:"), t);
  }
});
