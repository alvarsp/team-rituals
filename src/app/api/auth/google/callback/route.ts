import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { exchangeCodeForTokens } from "@/lib/google/oauth";
import {
  getSessionOptions,
  type GoogleSession,
} from "@/lib/session";

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/", req.nextUrl.origin));
  const session = await getIronSession<GoogleSession>(
    req,
    response,
    getSessionOptions(),
  );

  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const oauthError = params.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(oauthError)}`, req.nextUrl.origin),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/?error=missing_code", req.nextUrl.origin),
    );
  }

  const expected = req.cookies.get("oauth_state")?.value;
  if (!expected || expected !== state) {
    return NextResponse.redirect(
      new URL("/?error=state_mismatch", req.nextUrl.origin),
    );
  }

  const tokens = await exchangeCodeForTokens(code);
  session.accessToken = tokens.access_token;
  session.accessTokenExpiresAt = Date.now() + tokens.expires_in * 1000;
  if (tokens.refresh_token) {
    session.refreshToken = tokens.refresh_token;
  }

  const me = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (me.ok) {
    const u = (await me.json()) as { email?: string; name?: string };
    session.userEmail = u.email;
    session.userName = u.name;
  }

  await session.save();
  response.cookies.delete("oauth_state");
  return response;
}
