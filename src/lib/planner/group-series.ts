import type { Occurrence, SeriesGroup } from "./types";

export function groupBySeries(occurrences: Occurrence[]): SeriesGroup[] {
  const byKey = new Map<string, Occurrence[]>();
  for (const o of occurrences) {
    const list = byKey.get(o.seriesKey) ?? [];
    list.push(o);
    byKey.set(o.seriesKey, list);
  }

  const groups: SeriesGroup[] = [];
  for (const [seriesKey, occs] of byKey) {
    occs.sort((a, b) => a.start.localeCompare(b.start));
    const first = occs[0];
    const start = new Date(first.start);
    const end = new Date(first.end);
    const durationMinutes = Math.max(
      0,
      Math.round((end.getTime() - start.getTime()) / 60000),
    );
    groups.push({
      seriesKey,
      recurringEventId: first.recurringEventId,
      summary: first.summary,
      durationMinutes,
      occurrences: occs,
    });
  }

  groups.sort((a, b) => a.summary.localeCompare(b.summary));
  return groups;
}
