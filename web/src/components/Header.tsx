import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-[rgba(241,233,210,0.12)] bg-[#0B0E1F]/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-[1120px] mx-auto px-4 min-h-16 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-[#FF9130] flex items-center justify-center font-bold text-[#1B140C] text-sm shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] rounded-sm">
            AP
          </div>
          <div>
            <span className="font-['Press_Start_2P'] text-[10px] sm:text-xs text-[#F1E9D2] tracking-wider group-hover:text-[#FF9130] transition-colors block">
              ATTENDANCE PREDICTOR
            </span>
            <span className="hidden sm:inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-[#1C2448] text-[#A88BFF] rounded border border-[#7C4DFF]/40">
              VibeCraft &apos;26
            </span>
          </div>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-5 text-xs sm:text-sm font-medium">
          <Link
            href="/planner"
            className="text-[#F1E9D2] hover:text-[#FF9130] transition-colors px-2 py-2 rounded-sm hover:bg-[#141A35]"
          >
            Planner
          </Link>
          <Link
            href="/timetable"
            className="text-[#CFC6A9] hover:text-[#FF9130] transition-colors px-2 py-2 rounded-sm hover:bg-[#141A35]"
          >
            Timetables
          </Link>
          <Link
            href="/rooms"
            className="hidden sm:block text-[#CFC6A9] hover:text-[#FF9130] transition-colors px-2 py-2 rounded-sm hover:bg-[#141A35]"
          >
            Room Finder
          </Link>
          <Link
            href="/how-it-works"
            className="hidden sm:block text-[#CFC6A9] hover:text-[#FF9130] transition-colors px-2 py-2 rounded-sm hover:bg-[#141A35]"
          >
            Methodology
          </Link>
        </nav>
      </div>
    </header>
  );
}
