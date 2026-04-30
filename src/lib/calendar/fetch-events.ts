import type { GoogleCalendarEventItem } from "@/lib/planner/types";

const YEAR = 2027;

export async function listExpandedYearEvents(
  accessToken: string,
  calendarId: string,
): Promise<GoogleCalendarEventItem[]> {
  const timeMin = new Date(Date.UTC(YEAR, 0, 1, 0, 0, 0)).toISOString();
  const timeMax = new Date(Date.UTC(YEAR + 1, 0, 1, 0, 0, 0)).toISOString();

  const all: GoogleCalendarEventItem[] = [];
  let pageToken: string | undefined;

  do {
    const u = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    );
    u.searchParams.set("timeMin", timeMin);
    u.searchParams.set("timeMax", timeMax);
    u.searchParams.set("singleEvents", "true");
    u.searchParams.set("orderBy", "startTime");
    u.searchParams.set("maxResults", "2500");
    if (pageToken) {
      u.searchParams.set("pageToken", pageToken);
    }

    const res = await fetch(u.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Calendar API error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as {
      items?: GoogleCalendarEventItem[];
      nextPageToken?: string;
    };
    all.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return all;
}
