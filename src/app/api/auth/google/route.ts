import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { buildGoogleAuthUrl } from "@/lib/google/oauth";

export async function GET() {
  const state = randomBytes(16).toString("hex");
  const url = buildGoogleAuthUrl(state);
  const res = NextResponse.redirect(url);
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
