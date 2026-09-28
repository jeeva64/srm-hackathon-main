import { addDays, classesOn, SEMESTER_END, type Section } from "./calendar";
import type { SubjectPlan } from "./attendance";

export type LeaveType = "od" | "medical";

export interface LeaveSimulation {
  leaveType: LeaveType;
  requestedDays: number;
  affectedClasses: number;
  finalAttended: number;
  finalHeld: number;
  finalPct: number | null;
  changeFromCurrent: number | null;
}

/** Count scheduled periods for one subject over a calendar-day range. */
export function scheduledSubjectClasses(
  section: Section,
  code: string,
  startDate: string,
  dayCount: number,
): number {
  const days = Math.max(0, Math.floor(dayCount));
  if (days === 0 || startDate > SEMESTER_END) return 0;

  let count = 0;
  let date = startDate;
  for (let index = 0; index < days && date <= SEMESTER_END; index += 1) {
    count += classesOn(section, date).filter((slot) => code === "OVERALL" || slot.code === code).length;
    date = addDays(date, 1);
  }
  return count;
}

export function simulateLeave(
  subject: SubjectPlan,
  leaveType: LeaveType,
  affectedClasses: number,
  requestedDays: number,
): LeaveSimulation {
  const futureClasses = subject.gapClasses + subject.remaining;
  const affected = Math.max(0, Math.min(Math.floor(affectedClasses), futureClasses));
  const finalHeld = leaveType === "medical" ? subject.held + futureClasses - affected : subject.held + futureClasses;
  const finalAttended = leaveType === "medical"
    ? subject.attended + futureClasses - affected
    : subject.attended + futureClasses;
  const finalPct = finalHeld > 0 ? (finalAttended / finalHeld) * 100 : null;
  const currentPct = subject.currentPct;

  return {
    leaveType,
    requestedDays,
    affectedClasses: affected,
    finalAttended,
    finalHeld,
    finalPct,
    changeFromCurrent: finalPct !== null && currentPct !== null ? finalPct - currentPct : null,
  };
}
