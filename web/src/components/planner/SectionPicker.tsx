"use client";

import React, { useMemo, useState } from "react";
import { getSections } from "@/lib/data";

interface SectionPickerProps {
  selectedId: string;
  onSelect: (sectionId: string) => void;
}

export function SectionPicker({ selectedId, onSelect }: SectionPickerProps) {
  const sections = getSections();
  const [search, setSearch] = useState("");

  // Group sections by year
  const years = [4, 3, 2, 1];
  const yearRoman: Record<number, string> = { 4: "Year IV", 3: "Year III", 2: "Year II", 1: "Year I" };
  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sections;
    return sections.filter((section) =>
      [section.id, section.department, String(section.year), section.academicYear]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [search, sections]);

  return (
    <div className="space-y-4">
      {/* Searchable / Fast Select dropdown */}
      <div className="space-y-2">
        <label htmlFor="section-search" className="text-xs uppercase font-bold text-[#CFC6A9] shrink-0 tracking-wider">
          Find your section
        </label>
        <input
          id="section-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by section, department, or year"
          className="w-full bg-[#1C2448] text-[#F1E9D2] border border-[rgba(241,233,210,0.2)] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#FF9130]"
        />
      </div>

      <div className="space-y-2 sm:flex sm:items-center sm:gap-3">
        <label htmlFor="section-select" className="text-xs uppercase font-bold text-[#CFC6A9] shrink-0 tracking-wider">
          Selected section
        </label>
        <select
          id="section-select"
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full bg-[#1C2448] text-[#F1E9D2] border border-[rgba(241,233,210,0.2)] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#FF9130] focus:ring-1 focus:ring-[#FF9130]"
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id} ({s.department} · {s.totalWeeklyPeriods} classes/wk)
              {!s.isCurrentTimetable ? " [2024-25 archive]" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Visual grouped cards */}
      <div className="hidden sm:block space-y-4" aria-label="Matching class sections">
        {years.map((yr) => {
          const inYear = filteredSections.filter((s) => s.year === yr);
          if (inYear.length === 0) return null;

          return (
            <div key={yr} className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#A88BFF]">
                {yearRoman[yr]}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {inYear.map((s) => {
                  const isSelected = s.id === selectedId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onSelect(s.id)}
                      className={`text-left p-2.5 rounded-sm border transition-all ${
                        isSelected
                          ? "bg-[#FF9130] text-[#1B140C] border-[#FF9130] font-bold shadow-[2px_2px_0_0_rgba(0,0,0,0.5)]"
                          : "bg-[#141A35] text-[#F1E9D2] border-[rgba(241,233,210,0.12)] hover:border-[#FF9130]/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold">{s.id}</span>
                        {!s.isCurrentTimetable && (
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-normal ${
                              isSelected ? "bg-[#1B140C]/20 text-[#1B140C]" : "bg-[#1C2448] text-[#FFB35C]"
                            }`}
                            title={s.note || "2024-25 timetable"}
                          >
                            &apos;24-25
                          </span>
                        )}
                      </div>
                      <div className={`text-[11px] mt-1 ${isSelected ? "text-[#1B140C]/80" : "text-[#CFC6A9]"}`}>
                        {s.totalWeeklyPeriods} classes/wk · {s.subjects.length} sub
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {filteredSections.length === 0 && (
          <p className="text-xs text-[#CFC6A9] bg-[#1C2448]/60 border border-[rgba(241,233,210,0.1)] p-3 rounded-sm">
            No matching sections. Try a section code such as III-ECE-B.
          </p>
        )}
      </div>
    </div>
  );
}
