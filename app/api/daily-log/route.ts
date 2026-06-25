import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function todayDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export async function GET() {
  const date = todayDate();
  const log = await prisma.dailyLog.findUnique({ where: { date } });
  return NextResponse.json({ count: log?.count ?? 0 });
}

export async function PUT(request: NextRequest) {
  const { count } = await request.json();
  const date = todayDate();

  const log = await prisma.dailyLog.upsert({
    where: { date },
    update: { count },
    create: { date, count },
  });

  return NextResponse.json({ count: log.count });
}
