import { DateTime } from "luxon";
import type {
  Occurrence,
  ScenarioState,
  SeriesGroup,
  SyntheticRitual,
} from "./types";

const YEAR = 2027;

function firstStartInYear(
  zone: string,
  jsDow: number,
  hour: number,
  minute: number,
): DateTime {
  let d = DateTime.fromObject({ year: YEAR, month: 1, day: 1 }, { zone });
  const luxonWd = jsDow === 0 ? 7 : jsDow;
  while (d.weekday !== luxonWd) {
    d = d.plus({ days: 1 });
  }
  return d.set({ hour, minute, second: 0, millisecond: 0 });
}

function luxonJsDay(dt: DateTime): number {
  return dt.weekday === 7 ? 0 : dt.weekday;
}

function inferIntervalWeeks(occurrences: Occurrence[]): number {
  if (occurrences.length < 2) return 1;
  const a = new Date(occurrences[0].start).getTime();
  const b = new Date(occurrences[1].start).getTime();
  const days = Math.round((b - a) / (24 * 3600 * 1000));
  if (days >= 13) return 2;
  if (days >= 6) return 1;
  return 1;
}

function expandWeekly(
  zone: string,
  hour: number,
  minute: number,
  jsDow: number,
  intervalWeeks: number,
  durationMinutes: number,
  seriesKey: string,
  title: string,
): Occurrence[] {
  const interval = Math.max(1, Math.min(4, intervalWeeks));
  let cur = firstStartInYear(zone, jsDow, hour, minute);
  const endYear = DateTime.fromObject({ year: YEAR, month: 12, day: 31 }, {
    zone,
  }).endOf("day");

  const out: Occurrence[] = [];
  let i = 0;
  while (cur <= endYear && cur.year === YEAR) {
    const endOcc = cur.plus({ minutes: durationMinutes });
    out.push({
      id: `gen:${seriesKey}:${i}`,
      seriesKey,
      summary: title,
      start: cur.toUTC().toISO()!,
      end: endOcc.toUTC().toISO()!,
    });
    cur = cur.plus({ weeks: interval });
    i += 1;
  }
  return out;
}

function expandSynthetic(rule: SyntheticRitual, zone: string): Occurrence[] {
  const [hh, mm] = rule.timeOfDay.split(":").map((x) => Number.parseInt(x, 10));
  const hour = Number.isFinite(hh) ? hh : 10;
  const minute = Number.isFinite(mm) ? mm : 0;
  return expandWeekly(
    zone,
    hour,
    minute,
    rule.dayOfWeek,
    rule.intervalWeeks,
    rule.durationMinutes,
    rule.id,
    rule.title,
  );
}

/** Expand a hand-entered or scenario recurring ritual into 2027 instances. */
export function expandRitualRule(
  rule: SyntheticRitual,
  teamTimeZone: string,
): Occurrence[] {
  return expandSynthetic(rule, teamTimeZone);
}

/**
 * Merge baseline Google instances with local-only scenario edits.
 * Schedule overrides re-expand weekly/biweekly patterns inside 2027 (phase anchors on calendar year).
 */
export function applyScenario(
  groups: SeriesGroup[],
  scenario: ScenarioState,
  teamTimeZone: string,
): Occurrence[] {
  const removed = new Set(scenario.removedSeriesKeys);
  const result: Occurrence[] = [];

  for (const g of groups) {
    if (removed.has(g.seriesKey)) continue;
    const patch = scenario.seriesPatches[g.seriesKey] ?? {};
    const title = patch.title ?? g.summary;
    const duration = patch.durationMinutes ?? g.durationMinutes;

    const scheduleChanged =
      patch.dayOfWeek !== undefined || patch.intervalWeeks !== undefined;

    if (!scheduleChanged) {
      for (const o of g.occurrences) {
        const start = DateTime.fromISO(o.start, { zone: "utc" });
        const end = start.plus({ minutes: duration });
        result.push({
          ...o,
          summary: title,
          end: end.toUTC().toISO()!,
        });
      }
      continue;
    }

    const firstLuxon = DateTime.fromISO(g.occurrences[0].start, {
      zone: "utc",
    }).setZone(teamTimeZone);
    const jsDow =
      patch.dayOfWeek !== undefined ? patch.dayOfWeek : luxonJsDay(firstLuxon);
    const interval =
      patch.intervalWeeks !== undefined
        ? patch.intervalWeeks
        : inferIntervalWeeks(g.occurrences);

    result.push(
      ...expandWeekly(
        teamTimeZone,
        firstLuxon.hour,
        firstLuxon.minute,
        jsDow,
        interval,
        duration,
        g.seriesKey,
        title,
      ),
    );
  }

  for (const syn of scenario.syntheticRituals) {
    result.push(...expandSynthetic(syn, teamTimeZone));
  }

  result.sort((a, b) => a.start.localeCompare(b.start));
  return result;
}

export function emptyScenario(): ScenarioState {
  return {
    removedSeriesKeys: [],
    seriesPatches: {},
    syntheticRituals: [],
  };
}
