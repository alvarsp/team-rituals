import type { GoogleCalendarEventItem, Occurrence } from "./types";

export function mapGoogleItemToOccurrence(
  item: GoogleCalendarEventItem,
): Occurrence | null {
  if (item.status === "cancelled") {
    return null;
  }
  const startS = item.start?.dateTime;
  const endS = item.end?.dateTime;
  if (!startS || !endS) {
    return null;
  }
  const start = new Date(startS);
  const end = new Date(endS);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const seriesKey = item.recurringEventId ?? `single:${item.id}`;

  return {
    id: item.id,
    seriesKey,
    recurringEventId: item.recurringEventId,
    summary: item.summary ?? "(no title)",
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function mapGoogleEventsToOccurrences(
  items: GoogleCalendarEventItem[],
): Occurrence[] {
  const out: Occurrence[] = [];
  for (const item of items) {
    const o = mapGoogleItemToOccurrence(item);
    if (o) {
      out.push(o);
    }
  }
  return out;
}
