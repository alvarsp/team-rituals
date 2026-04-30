import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { listExpandedYearEvents } from "@/lib/calendar/fetch-events";
import { getWorkCalendarId } from "@/lib/google/calendar-config";
import { ensureFreshAccessToken } from "@/lib/google/token";
import { mapGoogleEventsToOccurrences } from "@/lib/planner/map-events";
import { getSessionOptions, type GoogleSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getIronSession<GoogleSession>(
    await cookies(),
    getSessionOptions(),
  );

  const access = await ensureFreshAccessToken(session);
  if (!access) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const calendarId =
    req.nextUrl.searchParams.get("calendarId") ?? getWorkCalendarId();

  try {
    const raw = await listExpandedYearEvents(access, calendarId);
    const occurrences = mapGoogleEventsToOccurrences(raw);
    return NextResponse.json({ occurrences, calendarId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Calendar fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
