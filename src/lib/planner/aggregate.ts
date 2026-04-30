import { DateTime } from "luxon";
import type { Occurrence } from "./types";

export type MonthTotals = {
  monthIndex: number;
  hours: number;
  count: number;
};

const YEAR = 2027;

export function aggregateByMonth(
  occs: Occurrence[],
  teamTimeZone: string,
): MonthTotals[] {
  const totals: MonthTotals[] = Array.from({ length: 12 }, (_, i) => ({
    monthIndex: i,
    hours: 0,
    count: 0,
  }));

  for (const o of occs) {
    const dt = DateTime.fromISO(o.start, { zone: "utc" }).setZone(teamTimeZone);
    if (dt.year !== YEAR) continue;
    const idx = dt.month - 1;
    const h =
      (new Date(o.end).getTime() - new Date(o.start).getTime()) / 3_600_000;
    totals[idx].hours += h;
    totals[idx].count += 1;
  }
  return totals;
}

export function totalYearHours(occs: Occurrence[]): number {
  let h = 0;
  for (const o of occs) {
    h +=
      (new Date(o.end).getTime() - new Date(o.start).getTime()) / 3_600_000;
  }
  return h;
}

export function filterOccurrencesForDesignTeam(
  occs: Occurrence[],
  keywords: string[],
  forcedInclude: Set<string>,
  forcedExclude: Set<string>,
): Occurrence[] {
  return occs.filter((o) => {
    if (forcedExclude.has(o.seriesKey)) {
      return false;
    }
    if (forcedInclude.has(o.seriesKey)) {
      return true;
    }
    return matchesKeywordFilter(o.summary, keywords);
  });
}

export function matchesKeywordFilter(
  summary: string,
  keywords: string[],
): boolean {
  const s = summary.toLowerCase();
  return keywords.some((k) => {
    const t = k.trim().toLowerCase();
    return t.length > 0 && s.includes(t);
  });
}
