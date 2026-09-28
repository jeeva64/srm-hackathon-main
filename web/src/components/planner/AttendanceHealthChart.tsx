"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SubjectPlan } from "@/lib/attendance";

interface AttendanceHealthChartProps {
  overall: SubjectPlan;
}

const chartData = (overall: SubjectPlan) => [
  {
    label: "Now",
    value: overall.currentPct ?? 0,
    color: "#FF9130",
  },
  {
    label: "Best case",
    value: overall.maxPossible ?? 0,
    color: "#6FA043",
  },
];

export function AttendanceHealthChart({ overall }: AttendanceHealthChartProps) {
  const current = overall.currentPct;
  const best = overall.maxPossible;
  const chartValues = chartData(overall);
  const headline = current === null
    ? "Add attendance to see your health"
    : current >= 75
      ? "You are above the danger zone"
      : "You need a recovery plan";

  return (
    <section className="soft-panel p-4 sm:p-5 mb-8" aria-labelledby="attendance-health-title">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <p className="eyebrow">At a glance</p>
          <h3 id="attendance-health-title" className="text-lg font-bold text-[#F1E9D2] mt-1">
            Attendance health
          </h3>
          <p className="text-xs text-[#CFC6A9] mt-1">Your current position compared with the best possible finish.</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm font-bold text-[#F1E9D2]">{headline}</p>
          <p className="text-xs text-[#CFC6A9] mt-1">
            {current !== null ? `${current.toFixed(1)}% now` : "No attendance entered"}
            {best !== null ? ` · ${best.toFixed(1)}% possible` : ""}
          </p>
        </div>
      </div>

      <div className="h-[220px] sm:h-[250px] w-full" role="img" aria-label="Bar chart comparing current attendance and best possible final attendance with 75 and 90 percent targets">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartValues} margin={{ top: 12, right: 8, left: -18, bottom: 0 }} barCategoryGap="34%">
            <CartesianGrid stroke="rgba(241,233,210,0.1)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#CFC6A9", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 90, 100]} tick={{ fill: "#CFC6A9", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
            <ReferenceLine y={75} stroke="#FF9130" strokeDasharray="5 5" label={{ value: "75% minimum", fill: "#FFB35C", fontSize: 10, position: "insideTopRight" }} />
            <ReferenceLine y={90} stroke="#A88BFF" strokeDasharray="5 5" label={{ value: "90% goal", fill: "#A88BFF", fontSize: 10, position: "insideTopRight" }} />
            <Tooltip
              cursor={{ fill: "rgba(241,233,210,0.05)" }}
              contentStyle={{ background: "#141A35", border: "1px solid rgba(241,233,210,0.2)", borderRadius: "4px", color: "#F1E9D2" }}
              labelStyle={{ color: "#F1E9D2", fontWeight: 700 }}
              itemStyle={{ color: "#F1E9D2" }}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, "Attendance"]}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={72}>
              {chartValues.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[#CFC6A9] mt-2" aria-hidden="true">
        <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#FF9130]" />Current</span>
        <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#6FA043]" />Best possible</span>
        <span className="inline-flex items-center gap-2"><span className="w-5 border-t border-dashed border-[#FF9130]" />75% minimum</span>
        <span className="inline-flex items-center gap-2"><span className="w-5 border-t border-dashed border-[#A88BFF]" />90% goal</span>
      </div>
    </section>
  );
}
