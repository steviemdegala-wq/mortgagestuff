import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getMondayOfWeek(d: Date): Date {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

export async function GET() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const monday = getMondayOfWeek(today);
  const saturday = new Date(monday);
  saturday.setUTCDate(monday.getUTCDate() + 5);

  const [activities, meetings] = await Promise.all([
    prisma.dailyActivity.findMany({
      where: { date: { gte: monday, lte: saturday } },
    }),
    prisma.faceToFaceMeeting.findMany({
      where: { date: { gte: monday, lte: saturday } },
      orderBy: { date: "desc" },
    }),
  ]);

  const totals = activities.reduce(
    (acc, a) => ({
      followUps: acc.followUps + a.followUps,
      newLeads: acc.newLeads + a.newLeads,
      creditPulls: acc.creditPulls + a.creditPulls,
      exerciseSessions: acc.exerciseSessions + (a.exerciseMinutes > 0 ? 1 : 0),
      exerciseMinutes: acc.exerciseMinutes + a.exerciseMinutes,
      readingMinutes: acc.readingMinutes + a.readingMinutes,
    }),
    { followUps: 0, newLeads: 0, creditPulls: 0, exerciseSessions: 0, exerciseMinutes: 0, readingMinutes: 0 }
  );

  return NextResponse.json({
    ...totals,
    faceToFaceMeetings: meetings,
    faceToFaceCount: meetings.length,
    faceToFaceGoal: 3,
  });
}
