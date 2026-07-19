import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));

  const events = await prisma.networkingEvent.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  const { eventName, date: dateParam } = await request.json();
  if (!eventName?.trim() || !dateParam) {
    return NextResponse.json({ error: "eventName and date required" }, { status: 400 });
  }
  const date = new Date(dateParam + "T00:00:00Z");
  const event = await prisma.networkingEvent.create({
    data: { eventName: eventName.trim(), date },
  });
  return NextResponse.json(event, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.networkingEvent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
