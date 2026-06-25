import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { type SessionData, sessionOptions } from "@/lib/session";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!password || password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ ok: true });
}
