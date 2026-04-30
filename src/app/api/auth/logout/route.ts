import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import {
  getSessionOptions,
  type GoogleSession,
} from "@/lib/session";

export async function POST() {
  const session = await getIronSession<GoogleSession>(
    await cookies(),
    getSessionOptions(),
  );
  session.destroy();
  await session.save();
  return NextResponse.json({ ok: true });
}
