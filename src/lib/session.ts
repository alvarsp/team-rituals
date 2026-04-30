import type { SessionOptions } from "iron-session";

export type GoogleSession = {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
  userEmail?: string;
  userName?: string;
};

export const defaultSession: GoogleSession = {};

export function getSessionOptions(): SessionOptions {
  const password =
    process.env.SESSION_PASSWORD ||
    (process.env.NODE_ENV !== "production"
      ? "dev-only-do-not-use-in-prod-32chars!!"
      : "");
  if (password.length < 32) {
    throw new Error(
      "SESSION_PASSWORD must be set to at least 32 characters in production",
    );
  }
  return {
    password,
    cookieName: "team_rituals_gcal",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    },
  };
}
