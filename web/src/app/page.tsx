import Link from "next/link";
import { getSections } from "@/lib/data";
import { SEMESTER_START, SEMESTER_END } from "@/lib/calendar";

export default function Home() {
  const sections = getSections();
  const totalSubjects = sections.reduce((acc, s) => acc + s.subjects.length, 0);

  // Calculate semester day metrics (Aug 29 to Nov 29 = 92 days)
  const start = new Date(SEMESTER_START).getTime();
  const end = new Date(SEMESTER_END).getTime();
  const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex flex-col min-h-full">
      <section className="max-w-[1120px] mx-auto w-full px-4 pt-10 pb-12 sm:pt-16 sm:pb-16">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-12 items-center">
          <div className="space-y-6">
            <div className="eyebrow inline-flex items-center gap-2 bg-[#141A35] border border-[#FF9130]/40 px-3 py-1.5 rounded-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6FA043]" />
              Attendance decision engine
            </div>

            <div className="space-y-4">
              <h1 className="font-['Press_Start_2P'] text-2xl sm:text-4xl lg:text-5xl text-[#F1E9D2] leading-tight">
                Your attendance, with a plan.
              </h1>
              <p className="text-base sm:text-lg text-[#CFC6A9] max-w-2xl leading-relaxed">
                Find out what you need to attend, what you can safely miss, and when recovery is no longer possible.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/planner"
            className="btn-block text-sm sm:text-base font-bold inline-flex items-center gap-2 rounded-sm"
          >
            <span>Start attendance plan</span>
            <span>→</span>
          </Link>

          <Link
            href="/timetable"
            className="px-5 py-3 bg-[#141A35] text-[#F1E9D2] border border-[rgba(241,233,210,0.2)] text-sm font-semibold rounded-sm hover:border-[#FF9130] transition-colors"
          >
            Browse timetables
          </Link>
            </div>

            <p className="text-xs text-[#CFC6A9]">
              Based on scheduled classes from 29 Aug to 29 Nov 2026.
            </p>
          </div>

          <div className="soft-panel p-5 sm:p-6 space-y-5 shadow-[4px_4px_0_0_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between gap-3 border-b border-[rgba(241,233,210,0.1)] pb-4">
              <div>
                <p className="eyebrow">Your route</p>
                <h2 className="text-lg font-bold text-[#F1E9D2] mt-1">Three quick checks</h2>
              </div>
              <span className="text-2xl text-[#FF9130]" aria-hidden="true">↗</span>
            </div>
            <div className="space-y-4">
              {[
                ["01", "Choose your section", "Use your verified timetable."],
                ["02", "Enter attendance", "Percentage or exact counts."],
                ["03", "Get your answer", "See your recovery room."],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-3 items-start">
                  <span className="w-7 h-7 shrink-0 rounded-sm bg-[#FF9130] text-[#1B140C] text-xs font-bold flex items-center justify-center font-mono">
                    {number}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#F1E9D2]">{title}</h3>
                    <p className="text-xs text-[#CFC6A9] mt-0.5">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[rgba(241,233,210,0.12)] bg-[#141A35]/60 py-5 px-4">
        <div className="max-w-[1120px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3">
            <span className="block font-mono text-2xl sm:text-3xl font-extrabold text-[#F1E9D2]">
              {sections.length}
            </span>
            <span className="text-xs uppercase tracking-wider text-[#CFC6A9]">
              Verified sections
            </span>
          </div>
          <div className="p-3">
            <span className="block font-mono text-2xl sm:text-3xl font-extrabold text-[#F1E9D2]">
              {totalSubjects}
            </span>
            <span className="text-xs uppercase tracking-wider text-[#CFC6A9]">
              Subject records
            </span>
          </div>
          <div className="p-3">
            <span className="block font-mono text-2xl sm:text-3xl font-extrabold text-[#6FA043]">
              {totalDays}
            </span>
            <span className="text-xs uppercase tracking-wider text-[#CFC6A9]">
              Semester days
            </span>
          </div>
          <div className="p-3">
            <span className="block font-mono text-2xl sm:text-3xl font-extrabold text-[#A88BFF]">
              100%
            </span>
            <span className="text-xs uppercase tracking-wider text-[#CFC6A9]">
              Exact calculations
            </span>
          </div>
        </div>
      </section>

      <section className="max-w-[1120px] mx-auto w-full px-4 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <p className="eyebrow">What you get</p>
            <h2 className="section-title mt-2">A clearer answer before it is too late.</h2>
          </div>
          <p className="text-xs text-[#CFC6A9] max-w-sm">Turn a portal percentage into an attendance decision you can act on today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            ["Know what to attend", "See the minimum number of remaining classes needed to stay above 75%.", "#FF9130"],
            ["Protect your 90% goal", "Check whether 90% is still reachable and how much effort it needs.", "#A88BFF"],
            ["Catch risk early", "Get a direct warning when recovery is mathematically impossible.", "#6FA043"],
          ].map(([title, description, color]) => (
            <div key={title} className="soft-panel p-5 space-y-3">
              <span className="block w-8 h-1 rounded-full" style={{ backgroundColor: color }} />
              <h3 className="font-bold text-base text-[#F1E9D2]">{title}</h3>
              <p className="text-sm text-[#CFC6A9] leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
