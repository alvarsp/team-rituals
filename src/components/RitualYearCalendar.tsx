"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { DateTime } from "luxon";
import type { Occurrence } from "@/lib/planner/types";
import {
  buildOccurrencesByDay,
  leadingEmptyCells,
  type DayRitualSummary,
} from "@/lib/planner/day-aggregate";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const WEEK_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function tooltipForDay(summary: DayRitualSummary): string {
  const lines = [
    `${summary.count} session(s) · ${summary.hours.toFixed(1)}h total`,
    ...summary.titles.map((t) => `· ${t}`),
  ];
  return lines.join("\n");
}

type Props = {
  year: number;
  teamTz: string;
  occurrences: Occurrence[];
};

export function RitualYearCalendar({ year, teamTz, occurrences }: Props) {
  const byDay = useMemo(
    () => buildOccurrencesByDay(occurrences, teamTz, year),
    [occurrences, teamTz, year],
  );

  const maxDayHours = useMemo(() => {
    let m = 0;
    for (const v of byDay.values()) {
      if (v.hours > m) m = v.hours;
    }
    return m || 1;
  }, [byDay]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Ritual calendar · {year}</h2>
        <p className="text-sm text-muted-foreground">
          Day cells use team timezone{" "}
          <span className="font-mono text-xs">{teamTz}</span>. Hover a day for
          session names and times.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {MONTH_NAMES.map((name, monthIndex) => {
          const first = DateTime.fromObject(
            { year, month: monthIndex + 1, day: 1 },
            { zone: teamTz },
          );
          const pad = leadingEmptyCells(first);
          const daysInMonth = first.daysInMonth ?? 30;
          const cells: ReactNode[] = [];

          for (let i = 0; i < pad; i++) {
            cells.push(
              <div
                key={`pad-${monthIndex}-${i}`}
                className="min-h-[2rem] rounded-md border border-transparent"
                aria-hidden
              />,
            );
          }
          for (let d = 1; d <= daysInMonth; d++) {
            const key = DateTime.fromObject(
              { year, month: monthIndex + 1, day: d },
              { zone: teamTz },
            ).toFormat("yyyy-LL-dd");
            const summary = byDay.get(key);
            const intensity =
              summary && maxDayHours > 0
                ? Math.min(1, summary.hours / maxDayHours)
                : 0;

            cells.push(
              <div
                key={key}
                title={
                  summary
                    ? tooltipForDay(summary)
                    : `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
                }
                className={cn(
                  "flex min-h-[2rem] flex-col items-center justify-start rounded-md border px-0.5 py-1 text-center text-xs tabular-nums",
                  summary
                    ? "border-primary/25 bg-primary/[0.08] font-medium text-foreground"
                    : "border-border/60 text-muted-foreground",
                )}
                style={
                  summary && intensity > 0
                    ? {
                        backgroundColor: `color-mix(in oklch, var(--primary) ${Math.round(12 + intensity * 28)}%, transparent)`,
                      }
                    : undefined
                }
              >
                <span>{d}</span>
                {summary ? (
                  <span className="mt-0.5 hidden text-[10px] leading-none text-muted-foreground sm:block">
                    {summary.count > 1 ? `${summary.count}` : "·"}
                  </span>
                ) : null}
              </div>,
            );
          }

          return (
            <Card key={name} size="sm" className="py-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{name}</CardTitle>
                <CardDescription className="text-xs">{year}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="grid grid-cols-7 gap-0.5 text-[10px] font-medium text-muted-foreground">
                  {WEEK_HEADERS.map((h, i) => (
                    <div key={`${name}-h-${i}`} className="text-center">
                      {h}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5">{cells}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded border border-border bg-background" />{" "}
          No rituals
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded border border-primary/25 bg-primary/15" />{" "}
          One or more sessions (darker ≈ more hours that day)
        </span>
      </div>
    </section>
  );
}
