"use client";

import React, { useMemo, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import type { SubjectPlan } from "@/lib/attendance";
import type { Section } from "@/lib/calendar";
import { addDays, formatDate } from "@/lib/calendar";
import { scheduledSubjectClasses, simulateLeave } from "@/lib/leave";

interface AttendanceAdvisorProps {
  section: Section;
  subjects: SubjectPlan[];
  overall: SubjectPlan;
  today: string;
}

interface AdvisorMessage {
  role: "assistant" | "user";
  text: string;
}

const SUGGESTIONS = [
  "Can I miss any more classes?",
  "How many classes do I need for 90%?",
  "What happens with 3 days sick leave?",
];

export function AttendanceAdvisor({ section, subjects, overall, today }: AttendanceAdvisorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<AdvisorMessage[]>([
    { role: "assistant", text: "I can read this plan and explain your next best move. Ask me about missed classes, 75%, 90%, OD, or medical leave." },
  ]);

  const subjectLookup = useMemo(() => subjects.map((subject) => ({
    subject,
    terms: `${subject.name} ${subject.code}`.toLowerCase(),
  })), [subjects]);

  const answerQuestion = (rawQuestion: string) => {
    const text = rawQuestion.trim();
    if (!text) return;
    const normalized = text.toLowerCase();
    const match = subjectLookup.find((item) => normalized.includes(item.subject.code.toLowerCase()) || normalized.includes(item.subject.name.toLowerCase()));
    const subject = match?.subject ?? overall;
    const subjectLabel = subject.code === "OVERALL" ? "overall attendance" : subject.name;
    const numberMatch = normalized.match(/\b(\d+(?:\.\d+)?)\b/);
    const number = numberMatch ? Number(numberMatch[1]) : null;
    let response: string;

    if (normalized.includes("leave") || normalized.includes("sick") || normalized.includes("medical") || normalized.includes("od") || normalized.includes("on-duty")) {
      const days = Math.max(1, Math.min(60, number ?? 3));
      const leaveType = normalized.includes("od") || normalized.includes("on-duty") ? "od" : "medical";
      const startDate = normalized.includes("tomorrow") ? addDays(today, 1) : today;
      const affectedClasses = scheduledSubjectClasses(section, subject.code, startDate, days);
      const simulation = simulateLeave(subject, leaveType, affectedClasses, days);
      const projected = simulation.finalPct === null ? "not available" : `${simulation.finalPct.toFixed(1)}%`;
      const outcome = simulation.finalPct !== null && simulation.finalPct >= 75 ? "above" : "below";
      response = `${subjectLabel} would project to ${projected} after ${days} ${days === 1 ? "day" : "days"} of ${leaveType === "od" ? "OD" : "medical leave"} from ${formatDate(startDate)}. ${simulation.affectedClasses} scheduled ${simulation.affectedClasses === 1 ? "class" : "classes"} are affected, leaving you ${outcome} the 75% minimum.`;
    } else if (normalized.includes("90") || normalized.includes("ninety")) {
      response = subject.required90 === null
        ? `90% is not reachable for ${subjectLabel} with the remaining timetable. The best possible finish is ${subject.maxPossible?.toFixed(1) ?? "not available"}%.`
        : `You need to attend ${subject.required90} of the ${subject.remaining} remaining classes in ${subjectLabel} to reach 90%.`;
    } else if (normalized.includes("miss") || normalized.includes("skip") || normalized.includes("absence")) {
      response = subject.safeAbsences75 === null
        ? `Recovery is not possible for ${subjectLabel} before the semester ends, even if you attend every remaining class.`
        : subject.safeAbsences75 > 0
          ? `You can miss up to ${subject.safeAbsences75} more ${subject.safeAbsences75 === 1 ? "class" : "classes"} in ${subjectLabel} and still finish at or above 75%.`
          : `You need to attend every remaining class in ${subjectLabel}. There is no absence room left for the 75% minimum.`;
    } else if (normalized.includes("75") || normalized.includes("attend") || normalized.includes("need")) {
      response = subject.required75 === null
        ? `Recovery is not possible for ${subjectLabel} before the semester ends. Its best possible finish is ${subject.maxPossible?.toFixed(1) ?? "not available"}%.`
        : `For ${subjectLabel}, attend ${subject.required75} of the ${subject.remaining} remaining classes to stay at or above 75%.`;
    } else {
      response = "Try asking: “Can I miss any more classes?”, “How many classes do I need for 90%?”, or “What happens with 3 days sick leave?”";
    }

    setMessages((current) => [...current, { role: "user", text }, { role: "assistant", text: response }]);
    setQuestion("");
  };

  return (
    <div className="fixed bottom-5 right-4 sm:right-6 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <section className="w-[min( calc(100vw - 2rem), 380px)] max-h-[min(620px,calc(100vh - 7rem))] flex flex-col bg-[#141A35] border border-[rgba(241,233,210,0.18)] rounded-sm shadow-[5px_5px_0_0_rgba(0,0,0,0.45)] overflow-hidden" aria-label="Attendance Advisor">
          <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[rgba(241,233,210,0.12)] bg-[#1C2448]">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-sm bg-[#FF9130] text-[#1B140C] flex items-center justify-center"><Bot className="w-4 h-4" /></span>
              <div><p className="text-sm font-bold text-[#F1E9D2]">Attendance Advisor</p><p className="text-[10px] text-[#6FA043]">Using your current plan</p></div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close Attendance Advisor" className="text-[#CFC6A9] hover:text-[#F1E9D2] p-1"><X className="w-4 h-4" /></button>
          </header>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[220px]" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <p className={`max-w-[88%] rounded-sm px-3 py-2 text-xs leading-relaxed ${message.role === "user" ? "bg-[#FF9130] text-[#1B140C]" : "bg-[#1C2448] text-[#F1E9D2] border border-[rgba(241,233,210,0.08)]"}`}>{message.text}</p>
              </div>
            ))}
          </div>

          <div className="px-3 pb-2 flex gap-2 overflow-x-auto">
            {SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => answerQuestion(suggestion)} className="shrink-0 text-[10px] text-[#CFC6A9] border border-[rgba(241,233,210,0.15)] rounded-sm px-2 py-1.5 hover:border-[#FF9130] hover:text-[#F1E9D2]">{suggestion}</button>)}
          </div>

          <form onSubmit={(event) => { event.preventDefault(); answerQuestion(question); }} className="flex gap-2 p-3 border-t border-[rgba(241,233,210,0.12)]">
            <label htmlFor="advisor-question" className="sr-only">Ask the Attendance Advisor</label>
            <input id="advisor-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about your attendance..." className="min-w-0 flex-1 bg-[#0B0E1F] text-[#F1E9D2] border border-[rgba(241,233,210,0.2)] rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#FF9130]" />
            <button type="submit" aria-label="Send question" className="w-9 h-9 shrink-0 bg-[#FF9130] text-[#1B140C] rounded-sm flex items-center justify-center hover:bg-[#FFB35C]"><Send className="w-4 h-4" /></button>
          </form>
        </section>
      )}

      <button type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-label={isOpen ? "Close Attendance Advisor" : "Open Attendance Advisor"} className="w-14 h-14 rounded-full bg-[#FF9130] text-[#1B140C] shadow-[3px_3px_0_0_rgba(0,0,0,0.45)] flex items-center justify-center hover:bg-[#FFB35C] transition-colors">
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>
    </div>
  );
}
