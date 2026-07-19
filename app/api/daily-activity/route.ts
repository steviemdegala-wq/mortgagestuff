import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const date = dateParam ? new Date(dateParam + "T00:00:00Z") : todayUTC();

  const activity = await prisma.dailyActivity.findUnique({
    where: { date },
    include: { conversationLogs: { orderBy: { slot: "asc" } } },
  });

  if (activity) {
    const personIds = activity.conversationLogs
      .map((l) => l.personId)
      .filter(Boolean) as string[];
    const people =
      personIds.length > 0
        ? await prisma.person.findMany({
            where: { id: { in: personIds } },
            select: { id: true, phone: true, email: true, role: true, markets: true, specializations: true },
          })
        : [];
    const personMap = Object.fromEntries(people.map((p) => [p.id, p]));
    const logsWithPerson = activity.conversationLogs.map((l) => ({
      ...l,
      partner: l.personId ? (personMap[l.personId] ?? null) : null,
    }));
    return NextResponse.json({ ...activity, conversationLogs: logsWithPerson });
  }

  return NextResponse.json(activity ?? null);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { date: dateParam, ...fields } = body;
  const date = dateParam ? new Date(dateParam + "T00:00:00Z") : todayUTC();

  const allowed = [
    "likes", "comments", "connectionRequests", "dms", "posts",
    "followUps", "newLeads", "creditPulls", "exerciseMinutes", "readingMinutes",
  ];
  const data: Record<string, number> = {};
  for (const key of allowed) {
    if (typeof fields[key] === "number") data[key] = fields[key];
  }

  const activity = await prisma.dailyActivity.upsert({
    where: { date },
    update: data,
    create: { date, ...data },
    include: { conversationLogs: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json(activity);
}
