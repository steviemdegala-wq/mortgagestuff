import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isWorkingDay(date: Date): boolean {
  const day = date.getDay(); // 0 = Sunday
  return day !== 0;
}

function getWorkingDaysInRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    if (isWorkingDay(current)) {
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "week";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let start: Date;
  if (range === "week") {
    // Mon to Sat of current week
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start = new Date(today);
    start.setDate(today.getDate() + diff);
  } else if (range === "month") {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
  } else {
    // year
    start = new Date(today.getFullYear(), 0, 1);
  }

  const workingDays = getWorkingDaysInRange(start, today);

  const logs = await prisma.dailyLog.findMany({
    where: {
      date: { gte: start, lte: today },
    },
  });

  const logMap = new Map<string, number>();
  for (const log of logs) {
    const key = log.date.toISOString().split("T")[0];
    logMap.set(key, log.count);
  }

  let completedDays = 0;
  let totalConversations = 0;
  const chartData: { date: string; count: number }[] = [];

  for (const day of workingDays) {
    const key = day.toISOString().split("T")[0];
    const count = logMap.get(key) ?? 0;
    totalConversations += count;
    if (count >= 10) completedDays++;
    chartData.push({ date: key, count });
  }

  const totalWorkingDays = workingDays.length;
  const completionRate =
    totalWorkingDays > 0
      ? Math.round((completedDays / totalWorkingDays) * 100)
      : 0;
  const avgPerDay =
    totalWorkingDays > 0
      ? Math.round((totalConversations / totalWorkingDays) * 10) / 10
      : 0;

  return NextResponse.json({
    completionRate,
    avgPerDay,
    completedDays,
    totalWorkingDays,
    totalConversations,
    chartData,
  });
}
