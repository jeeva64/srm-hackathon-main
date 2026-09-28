# VibeCraft 2026 — Attendance Predictor + Room Finder

> **Event:** VibeCraft 2026 (Neuro Tech Titans × YUVA'26, SRM IST Tiruchirappalli)  
> **Challenge:** Smart Attendance Dashboard & Decision Engine (Semester: 29 Aug 2026 → 29 Nov 2026)

A unified student dashboard that calculates attendance recovery plans and finds timetable-verified rooms that are free at a selected date and time.

---

## 🌐 Live Demo

**https://neuragenzers.vercel.app/**

---

## Repository Layout

```
web/
├── src/app/                    # Routes: /, /planner, /rooms, /timetable, /how-it-works
│   ├── page.tsx               # Landing page with live stats strip
│   ├── planner/page.tsx       # Core Decision Engine
│   ├── rooms/page.tsx         # Timetable-based Room Finder
│   ├── timetable/page.tsx     # Weekly timetable grid + audit
│   └── how-it-works/page.tsx  # Technical methodology
├── src/components/             # Planner, Timetable, KPI grids, status badges
│   ├── planner/               # SectionPicker, AttendanceTable, KpiGrid, etc.
│   ├── timetable/             # TimetableView
│   └── ui/                    # StatusChip, Goal90Badge
├── src/lib/                   # TypeScript deterministic engines and helpers
│   ├── attendance.ts          # Core math: required classes, status, trajectory
│   ├── calendar.ts            # Semester calendar, scheduled occurrences
│   ├── data.ts                # Section/timetable data access
│   ├── rooms.ts                # Timetable-based room availability
│   ├── roomQuery.ts            # Natural-language room filter parser
│   ├── useToday.ts            # Hydration-safe browser date
│   └── storage.ts             # localStorage persistence
├── src/app/api/room-query/     # Optional server-side Gemini filter extraction
├── src/data/timetables.json   # 13 verified class sections
├── src/data/rooms.json        # Known rooms and timetable occupancy
├── tests/engine.test.ts       # Attendance engine tests
├── tests/rooms.test.ts        # Room availability tests
├── package.json               # Next.js 16, React 19, Tailwind v4
├── next.config.ts             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
└── eslint.config.mjs          # ESLint flat config
```

---

## 🚀 Running the Web Application

```bash
cd web
npm install
npm run dev        # http://localhost:3000
npm run lint       # ESLint (0 errors)
npm run build      # Production build
```

Optional server-side Room Finder AI environment variable names:

```text
GEMINI_API_KEY
GEMINI_MODEL
GEMINI_FALLBACK_MODEL
```

Keep values in `web/.env.local` or the deployment provider. Never use a `NEXT_PUBLIC_` prefix for the API key.

### Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with live semester stats & feature explainer |
| `/planner` | Core Decision Engine — section selector, attendance inputs, 6 KPI answers, subject breakdown |
| `/rooms` | Room Finder — floor grid, filters, and optional natural-language search |
| `/timetable` | Weekly period-by-period grid (Mon–Fri) + semester occurrence audit |
| `/how-it-works` | Transparent methodology, integer arithmetic proofs, data provenance |

---

## 🧪 Tests

```bash
cd web
npx tsx --test tests/engine.test.ts tests/rooms.test.ts

cd ..
python -m pytest -q tests
```

The TypeScript suite covers attendance parity and room availability; the Python suite covers the reference engine.

---

## 📐 Key Assumptions (Frontend)

1. **Counting Unit**: 1 timetable period = 1 attendance hour (2-period lab = 2)
2. **Instruction Days**: Monday–Friday only
3. **Today's Date**: Read dynamically from browser via `useToday()` — never hardcoded
4. **Exact Integer Arithmetic**: Cross-multiplication avoids floating-point drift
5. **Conservative Estimation**: Percentage mode picks lowest consistent attended count
6. **All 13 Sections**: 9 active 2026-27 + 4 archival 2024-25 (flagged with badge)
7. **Scheduled versus actual classes**: attendance and room results use scheduled timetable occurrences; cancellations, holidays, and changes may differ in reality.
8. **Room data limits**: only rooms present in the supplied timetables are known. AC and capacity are not present in the source data, so the Room Finder reports those limits honestly.

---

## ☁️ Deployment

| Platform | Config |
|----------|--------|
| **Vercel** (Live) | Framework: Next.js, Root: `web/`, Build: `next build` |
| **Live URL** | **https://neuragenzers.vercel.app/** |

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts 3
- **Fonts**: Press Start 2P, Rubik
- **Motion**: Motion (Framer Motion)
- **Linting**: ESLint 9 (flat config)

---

## 📄 License

Built for VibeCraft 2026 — SRM IST Tiruchirappalli
