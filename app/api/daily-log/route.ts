import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDate(dateParam: string | null): Date {
  if (dateParam) return new Date(dateParam + "T00:00:00Z");
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = parseDate(searchParams.get("date"));
  const log = await prisma.dailyLog.findUnique({ where: { date } });
  return NextResponse.json({ count: log?.count ?? 0 });
}

export async function PUT(request: NextRequest) {
  const { count, date: dateParam } = await request.json();
  const date = parseDate(dateParam ?? null);

  const log = await prisma.dailyLog.upsert({
    where: { date },
    update: { count },
    create: { date, count },
  });

  return NextResponse.json({ count: log.count });
}
