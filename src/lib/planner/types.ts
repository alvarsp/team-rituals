/** Raw item from Google Calendar API events.list */
export type GoogleCalendarEventItem = {
  id: string;
  status?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  recurringEventId?: string;
  iCalUID?: string;
};

/** One concrete instance used for totals and UI */
export type Occurrence = {
  id: string;
  seriesKey: string;
  recurringEventId?: string;
  summary: string;
  start: string; // ISO
  end: string; // ISO
};

/** One recurring / single series after grouping imported data */
export type SeriesGroup = {
  seriesKey: string;
  recurringEventId?: string;
  summary: string;
  /** Minutes, from first occurrence */
  durationMinutes: number;
  /** All instances in import range */
  occurrences: Occurrence[];
};

/** Editable scenario (never written to Google) */
export type SeriesPatch = {
  title?: string;
  durationMinutes?: number;
  /** 1 = weekly, 2 = biweekly */
  intervalWeeks?: number;
  /** 0 = Sunday … 6 = Saturday (JavaScript getDay) */
  dayOfWeek?: number;
};

export type SyntheticRitual = {
  id: string;
  title: string;
  durationMinutes: number;
  intervalWeeks: number;
  dayOfWeek: number;
  /** "HH:mm" interpreted in teamTimeZone */
  timeOfDay: string;
};

export type ScenarioState = {
  removedSeriesKeys: string[];
  seriesPatches: Record<string, SeriesPatch>;
  syntheticRituals: SyntheticRitual[];
};

export const DEFAULT_FILTER_KEYWORDS = [
  "design",
  "all hands",
  "all-hands",
  "ama",
  "jam",
  "ritual",
  "olx",
  "crit",
  "sync",
];

export const STORAGE_KEYS = {
  filters: "team-rituals:filters-v1",
  scenario: "team-rituals:scenario-v1",
  timeZone: "team-rituals:timezone-v1",
  manualRituals: "team-rituals:manual-rituals-v1",
} as const;
