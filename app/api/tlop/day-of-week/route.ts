import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "month";

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let start: Date;
  if (range === "3months") {
    start = new Date(today);
    start.setUTCMonth(today.getUTCMonth() - 3);
  } else if (range === "year") {
    start = new Date(today);
    start.setUTCFullYear(today.getUTCFullYear() - 1);
  } else {
    start = new Date(today);
    start.setUTCMonth(today.getUTCMonth() - 1);
  }

  const [activities, dailyLogs] = await Promise.all([
    prisma.dailyActivity.findMany({
      where: { date: { gte: start, lte: today } },
      select: { date: true, followUps: true, newLeads: true, creditPulls: true },
    }),
    prisma.dailyLog.findMany({
      where: { date: { gte: start, lte: today } },
      select: { date: true, count: true },
    }),
  ]);

  const logMap = new Map<string, number>();
  for (const log of dailyLogs) {
    logMap.set(log.date.toISOString().split("T")[0], log.count);
  }

  // 1 = Mon, 2 = Tue, ..., 6 = Sat (Sunday = 0, excluded)
  const buckets: Record<number, { conversations: number[]; followUps: number[]; newLeads: number[]; creditPulls: number[] }> = {};
  for (let d = 1; d <= 6; d++) {
    buckets[d] = { conversations: [], followUps: [], newLeads: [], creditPulls: [] };
  }

  // Collect activity data by weekday
  for (const a of activities) {
    const day = a.date.getUTCDay();
    if (day === 0) continue;
    const key = a.date.toISOString().split("T")[0];
    const convCount = logMap.get(key) ?? 0;
    buckets[day].conversations.push(convCount);
    buckets[day].followUps.push(a.followUps);
    buckets[day].newLeads.push(a.newLeads);
    buckets[day].creditPulls.push(a.creditPulls);
  }

  // Also account for dailyLog days that have no DailyActivity entry
  for (const log of dailyLogs) {
    const day = log.date.getUTCDay();
    if (day === 0) continue;
    const key = log.date.toISOString().split("T")[0];
    const alreadyCounted = activities.some(
      (a) => a.date.toISOString().split("T")[0] === key
    );
    if (!alreadyCounted) {
      buckets[day].conversations.push(log.count);
    }
  }

  function avg(arr: number[]) {
    if (!arr.length) return 0;
    return Math.round((arr.reduce((s, n) => s + n, 0) / arr.length) * 10) / 10;
  }

  const rows = [1, 2, 3, 4, 5, 6].map((d) => ({
    day: DAY_NAMES[d - 1],
    avgConversations: avg(buckets[d].conversations),
    avgFollowUps: avg(buckets[d].followUps),
    avgNewLeads: avg(buckets[d].newLeads),
    avgCreditPulls: avg(buckets[d].creditPulls),
    sampleSize: buckets[d].conversations.length,
  }));

  const withData = rows.filter((r) => r.sampleSize > 0);
  let bestDay = "";
  let worstDay = "";
  if (withData.length > 0) {
    bestDay = withData.reduce((a, b) => (b.avgConversations > a.avgConversations ? b : a)).day;
    worstDay = withData.reduce((a, b) => (b.avgConversations < a.avgConversations ? b : a)).day;
    if (bestDay === worstDay) worstDay = "";
  }

  return NextResponse.json({ rows, bestDay, worstDay });
}
