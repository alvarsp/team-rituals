import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { getSessionOptions, type GoogleSession } from "@/lib/session";

export async function GET() {
  const session = await getIronSession<GoogleSession>(
    await cookies(),
    getSessionOptions(),
  );

  const loggedIn = Boolean(session.accessToken || session.refreshToken);
  return NextResponse.json({
    loggedIn,
    email: session.userEmail ?? null,
    name: session.userName ?? null,
  });
}
