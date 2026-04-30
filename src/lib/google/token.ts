import type { IronSession } from "iron-session";
import type { GoogleSession } from "@/lib/session";
import { refreshAccessToken } from "./oauth";

export async function ensureFreshAccessToken(
  session: IronSession<GoogleSession>,
): Promise<string | null> {
  if (!session.accessToken && !session.refreshToken) {
    return null;
  }
  const now = Date.now();
  const skewMs = 120_000;
  if (
    session.accessToken &&
    session.accessTokenExpiresAt &&
    now < session.accessTokenExpiresAt - skewMs
  ) {
    return session.accessToken;
  }
  if (!session.refreshToken) {
    return session.accessToken ?? null;
  }
  const t = await refreshAccessToken(session.refreshToken);
  session.accessToken = t.access_token;
  session.accessTokenExpiresAt = now + t.expires_in * 1000;
  if (t.refresh_token) {
    session.refreshToken = t.refresh_token;
  }
  await session.save();
  return session.accessToken;
}
