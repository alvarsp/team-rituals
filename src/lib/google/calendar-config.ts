/**
 * Calendar ID to load for the planner (server-side).
 * Use your OLX work calendar ID — often your work email for the primary calendar,
 * or the ID from Google Calendar → Settings → Integrate calendar.
 * Falls back to `primary` when unset.
 */
export function getWorkCalendarId(): string {
  const id = process.env.GOOGLE_WORK_CALENDAR_ID?.trim();
  return id && id.length > 0 ? id : "primary";
}
