import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "week";

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let start: Date;
  if (range === "week") {
    const day = today.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    start = new Date(today);
    start.setUTCDate(today.getUTCDate() + diff);
  } else {
    start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  }

  const meetings = await prisma.faceToFaceMeeting.findMany({
    where: { date: { gte: start, lte: today } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(meetings);
}

export async function POST(request: NextRequest) {
  const { contactName, date: dateParam } = await request.json();
  if (!contactName?.trim() || !dateParam) {
    return NextResponse.json({ error: "contactName and date required" }, { status: 400 });
  }
  const date = new Date(dateParam + "T00:00:00Z");
  const meeting = await prisma.faceToFaceMeeting.create({
    data: { contactName: contactName.trim(), date },
  });
  return NextResponse.json(meeting, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.faceToFaceMeeting.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
