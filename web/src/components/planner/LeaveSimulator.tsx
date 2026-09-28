"use client";

import React, { useState } from "react";
import { CalendarDays, ChevronDown, HeartPulse, ShieldCheck } from "lucide-react";
import type { Section } from "@/lib/calendar";
import type { SubjectPlan } from "@/lib/attendance";
import { SEMESTER_END, formatDate } from "@/lib/calendar";
import { scheduledSubjectClasses, simulateLeave, type LeaveType } from "@/lib/leave";

interface LeaveSimulatorProps {
  section: Section;
  subjects: SubjectPlan[];
  today: string;
}

export function LeaveSimulator({ section, subjects, today }: LeaveSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subjectCode, setSubjectCode] = useState(subjects[0]?.code ?? "");
  const [leaveType, setLeaveType] = useState<LeaveType>("od");
  const [leaveDays, setLeaveDays] = useState("3");
  const [startDate, setStartDate] = useState(today);

  const subject = subjects.find((item) => item.code === subjectCode) ?? subjects[0];
  const dayCount = Math.max(0, Math.min(60, Number.parseInt(leaveDays, 10) || 0));
  const affectedClasses = subject
    ? scheduledSubjectClasses(section, subject.code, startDate, dayCount)
    : 0;
  const simulation = subject
    ? simulateLeave(subject, leaveType, affectedClasses, dayCount)
    : null;
  const subjectName = subject?.name ?? "your subject";
  const projectedPct = simulation?.finalPct ?? null;
  const remainsSafe = projectedPct !== null && projectedPct !== undefined && projectedPct >= 75;

  const leaveSummary = !simulation
    ? "Add your leave details to see the projected result."
    : simulation.affectedClasses === 0
      ? "No classes for this subject fall inside those dates."
      : `${simulation.affectedClasses} scheduled ${simulation.affectedClasses === 1 ? "class" : "classes"} affected`;

  return (
    <section className="soft-panel overflow-hidden" aria-labelledby="leave-simulator-title">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left hover:bg-[#1C2448]/40 transition-colors"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 shrink-0 rounded-sm bg-[#A88BFF]/15 text-[#A88BFF] flex items-center justify-center">
            <HeartPulse className="w-5 h-5" />
          </span>
          <span>
            <span className="eyebrow block">What if?</span>
            <span id="leave-simulator-title" className="block text-base font-bold text-[#F1E9D2] mt-1">OD & medical leave simulator</span>
            <span className="block text-xs text-[#CFC6A9] mt-1">See your final percentage before you submit a leave request.</span>
          </span>
        </span>
        <ChevronDown className={`w-5 h-5 shrink-0 text-[#CFC6A9] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="border-t border-[rgba(241,233,210,0.1)] p-4 sm:p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#CFC6A9]">Subject</span>
              <select
                value={subjectCode}
                onChange={(event) => setSubjectCode(event.target.value)}
                className="w-full bg-[#1C2448] text-[#F1E9D2] border border-[rgba(241,233,210,0.2)] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF9130]"
              >
                {subjects.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
              </select>
            </label>

            <fieldset className="space-y-2">
              <legend className="text-xs font-bold uppercase tracking-wider text-[#CFC6A9]">Leave type</legend>
              <div className="grid grid-cols-2 gap-2">
                <label className={`flex items-center gap-2 border rounded-sm px-3 py-2.5 text-sm cursor-pointer ${leaveType === "od" ? "border-[#FF9130] bg-[#FF9130]/10 text-[#F1E9D2]" : "border-[rgba(241,233,210,0.15)] text-[#CFC6A9]"}`}>
                  <input type="radio" name="leave-type" value="od" checked={leaveType === "od"} onChange={() => setLeaveType("od")} className="accent-[#FF9130]" />
                  OD / credited
                </label>
                <label className={`flex items-center gap-2 border rounded-sm px-3 py-2.5 text-sm cursor-pointer ${leaveType === "medical" ? "border-[#A88BFF] bg-[#A88BFF]/10 text-[#F1E9D2]" : "border-[rgba(241,233,210,0.15)] text-[#CFC6A9]"}`}>
                  <input type="radio" name="leave-type" value="medical" checked={leaveType === "medical"} onChange={() => setLeaveType("medical")} className="accent-[#A88BFF]" />
                  Medical / excused
                </label>
              </div>
            </fieldset>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#CFC6A9]">Leave starts</span>
              <span className="relative block">
                <CalendarDays className="absolute left-3 top-3 w-4 h-4 text-[#FF9130] pointer-events-none" />
                <input type="date" min={today} max={SEMESTER_END} value={startDate} onChange={(event) => setStartDate(event.target.value)} className="w-full bg-[#1C2448] text-[#F1E9D2] border border-[rgba(241,233,210,0.2)] rounded-sm pl-10 pr-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#FF9130]" />
              </span>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#CFC6A9]">Number of days</span>
              <input type="number" min="1" max="60" value={leaveDays} onChange={(event) => setLeaveDays(event.target.value)} className="w-full bg-[#1C2448] text-[#F1E9D2] border border-[rgba(241,233,210,0.2)] rounded-sm px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#FF9130]" />
            </label>
          </div>

          <div className="flex items-start gap-2 text-xs text-[#CFC6A9] bg-[#1C2448]/50 border border-[rgba(241,233,210,0.1)] rounded-sm p-3">
            <CalendarDays className="w-4 h-4 shrink-0 text-[#FFB35C] mt-0.5" />
            <span>{leaveSummary}. The preview uses scheduled timetable periods, not calendar days as a direct class count.</span>
          </div>

          {simulation && (
            <div className={`rounded-sm border p-4 ${remainsSafe ? "border-[#6FA043]/60 bg-[#6FA043]/10" : "border-[#E33D2E]/70 bg-[#E33D2E]/10"}`} aria-live="polite">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <span className="eyebrow">Projected final attendance</span>
                  <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#F1E9D2] mt-1">{projectedPct === null ? "—" : `${projectedPct.toFixed(1)}%`}</p>
                  <p className="text-sm text-[#F1E9D2] mt-2">
                    {simulation.affectedClasses === 0
                      ? `No ${subjectName} classes are scheduled in this window.`
                      : leaveType === "od"
                        ? `${subjectName} stays at its best-case finish because OD classes are credited as attended.`
                        : `${subjectName} excludes the affected classes from the attendance denominator.`}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-sm border ${remainsSafe ? "text-[#6FA043] border-[#6FA043]/50" : "text-[#E33D2E] border-[#E33D2E]/50"}`}>
                  <ShieldCheck className="w-4 h-4" />
                  {remainsSafe ? "Above 75%" : "Below 75%"}
                </span>
              </div>
              <p className="text-[11px] text-[#CFC6A9] mt-3">Preview for {formatDate(startDate)} onward. Confirm your institution&apos;s leave policy before relying on this estimate.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
