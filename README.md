# Attendance Predictor — VibeCraft 2026 (Round 1: The Overworld)

> **Event:** VibeCraft 2026 (Neuro Tech Titans × YUVA'26, SRM IST Tiruchirappalli)  
> **Challenge:** Smart Attendance Dashboard & Decision Engine (Semester: 29 Aug 2026 → 29 Nov 2026)

A decision engine that eliminates guesswork by calculating precisely how many classes a student must attend to stay above **75%** (detention threshold) or reach **90%**, with instant mathematical proofs for **Irreversible Detention** before detention becomes mathematically unavoidable.

---

## 🌐 Live Demo

**https://neuragenzers.vercel.app/**

---

## 📁 Repository Layout (Frontend Only)

```
web/
├── src/app/                    # Routes: /, /planner, /timetable, /how-it-works
│   ├── page.tsx               # Landing page with live stats strip
│   ├── planner/page.tsx       # Core Decision Engine
│   ├── timetable/page.tsx     # Weekly timetable grid + audit
│   └── how-it-works/page.tsx  # Technical methodology
├── src/components/             # Planner, Timetable, KPI grids, status badges
│   ├── planner/               # SectionPicker, AttendanceTable, KpiGrid, etc.
│   ├── timetable/             # TimetableView
│   └── ui/                    # StatusChip, Goal90Badge
├── src/lib/                   # TypeScript deterministic attendance engine
│   ├── attendance.ts          # Core math: required classes, status, trajectory
│   ├── calendar.ts            # Semester calendar, scheduled occurrences
│   ├── data.ts                # Section/timetable data access
│   ├── useToday.ts            # Hydration-safe browser date
│   └── storage.ts             # localStorage persistence
├── src/data/timetables.json   # 13 verified class sections (6000+ lines)
├── tests/engine.test.ts       # 11 tests (3,658 cross-checks vs Python reference)
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

### Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with live semester stats & feature explainer |
| `/planner` | Core Decision Engine — section selector, attendance inputs, 6 KPI answers, subject breakdown |
| `/timetable` | Weekly period-by-period grid (Mon–Fri) + semester occurrence audit |
| `/how-it-works` | Transparent methodology, integer arithmetic proofs, data provenance |

---

## 🧪 Tests

```bash
cd web
npx tsx --test tests/engine.test.ts
```

**11 passed** — includes 3,658 per-subject parity cross-checks against Python reference engine.

---

## 📐 Key Assumptions (Frontend)

1. **Counting Unit**: 1 timetable period = 1 attendance hour (2-period lab = 2)
2. **Instruction Days**: Monday–Friday only
3. **Today's Date**: Read dynamically from browser via `useToday()` — never hardcoded
4. **Exact Integer Arithmetic**: Cross-multiplication avoids floating-point drift
5. **Conservative Estimation**: Percentage mode picks lowest consistent attended count
6. **All 13 Sections**: 9 active 2026-27 + 4 archival 2024-25 (flagged with badge)

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
