import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

function parseDate(dateStr: string | null): Date {
  if (!dateStr) {
    // Fall back to Pacific today
    const s = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
    const [y, m, d] = s.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

async function attachPersons(logs: { id: string; dailyActivityId: string; contactName: string; createdAt: Date; slot: number; tags: string[]; personId: string | null }[]) {
  const personIds = logs.map((l) => l.personId).filter((id): id is string => id !== null);
  const persons = personIds.length > 0
    ? await prisma.person.findMany({ where: { id: { in: personIds } } })
    : [];
  const personMap = new Map(persons.map((p) => [p.id, p]));
  return logs.map((l) => ({
    ...l,
    Person: l.personId ? (personMap.get(l.personId) ?? null) : null,
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = parseDate(searchParams.get("date"));

  let activity = await prisma.dailyActivity.findUnique({
    where: { date },
    include: {
      conversationLogs: { orderBy: { slot: "asc" } },
    },
  });

  if (!activity) {
    activity = await prisma.dailyActivity.create({
      data: {
        id: randomUUID(),
        date,
        updatedAt: new Date(),
      },
      include: {
        conversationLogs: { orderBy: { slot: "asc" } },
      },
    });
  }

  const logsWithPerson = await attachPersons(activity.conversationLogs);
  return NextResponse.json({ ...activity, conversationLogs: logsWithPerson });
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = parseDate(searchParams.get("date"));
  const data = await request.json();

  const activity = await prisma.dailyActivity.upsert({
    where: { date },
    update: {
      ...(data.likes !== undefined && { likes: Number(data.likes) }),
      ...(data.comments !== undefined && { comments: Number(data.comments) }),
      ...(data.connectionRequests !== undefined && { connectionRequests: Number(data.connectionRequests) }),
      ...(data.dms !== undefined && { dms: Number(data.dms) }),
      ...(data.posts !== undefined && { posts: Number(data.posts) }),
      ...(data.followUps !== undefined && { followUps: Number(data.followUps) }),
      ...(data.newLeads !== undefined && { newLeads: Number(data.newLeads) }),
      ...(data.creditPulls !== undefined && { creditPulls: Number(data.creditPulls) }),
      ...(data.exerciseMinutes !== undefined && { exerciseMinutes: Number(data.exerciseMinutes) }),
      ...(data.readingMinutes !== undefined && { readingMinutes: Number(data.readingMinutes) }),
      updatedAt: new Date(),
    },
    create: {
      id: randomUUID(),
      date,
      ...(data.likes !== undefined && { likes: Number(data.likes) }),
      ...(data.comments !== undefined && { comments: Number(data.comments) }),
      ...(data.connectionRequests !== undefined && { connectionRequests: Number(data.connectionRequests) }),
      ...(data.dms !== undefined && { dms: Number(data.dms) }),
      ...(data.posts !== undefined && { posts: Number(data.posts) }),
      ...(data.followUps !== undefined && { followUps: Number(data.followUps) }),
      ...(data.newLeads !== undefined && { newLeads: Number(data.newLeads) }),
      ...(data.creditPulls !== undefined && { creditPulls: Number(data.creditPulls) }),
      ...(data.exerciseMinutes !== undefined && { exerciseMinutes: Number(data.exerciseMinutes) }),
      ...(data.readingMinutes !== undefined && { readingMinutes: Number(data.readingMinutes) }),
      updatedAt: new Date(),
    },
    include: {
      conversationLogs: { orderBy: { slot: "asc" } },
    },
  });

  return NextResponse.json(activity);
}
