import { DateTime } from "luxon";
import type { Occurrence } from "./types";

export type DayRitualSummary = {
  dateKey: string;
  count: number;
  hours: number;
  titles: string[];
};

/** Group occurrences by local calendar date in teamTimeZone. */
export function buildOccurrencesByDay(
  occurrences: Occurrence[],
  teamTimeZone: string,
  year: number,
): Map<string, DayRitualSummary> {
  type Acc = { count: number; hours: number; titles: Set<string> };
  const map = new Map<string, Acc>();

  for (const o of occurrences) {
    const dt = DateTime.fromISO(o.start, { zone: "utc" }).setZone(teamTimeZone);
    if (dt.year !== year) continue;
    const key = dt.toFormat("yyyy-LL-dd");
    const h =
      (new Date(o.end).getTime() - new Date(o.start).getTime()) / 3_600_000;
    const cur = map.get(key) ?? {
      count: 0,
      hours: 0,
      titles: new Set<string>(),
    };
    cur.count += 1;
    cur.hours += h;
    cur.titles.add(o.summary);
    map.set(key, cur);
  }

  const out = new Map<string, DayRitualSummary>();
  for (const [k, v] of map) {
    out.set(k, {
      dateKey: k,
      count: v.count,
      hours: v.hours,
      titles: Array.from(v.titles).sort(),
    });
  }
  return out;
}

/** Leading empty cells before day 1 (week starts Sunday). */
export function leadingEmptyCells(firstOfMonth: DateTime): number {
  const w = firstOfMonth.weekday;
  return w === 7 ? 0 : w;
}
