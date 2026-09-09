import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

function todayDate() {
  const s = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const date = todayDate();

  // Get or create today's DailyActivity
  let activity = await prisma.dailyActivity.findUnique({
    where: { date },
    include: { conversationLogs: { select: { slot: true } } },
  });

  if (!activity) {
    activity = await prisma.dailyActivity.create({
      data: { id: randomUUID(), date, updatedAt: new Date() },
      include: { conversationLogs: { select: { slot: true } } },
    });
  }

  // Find the next empty slot (0–9), skip if all 10 are filled
  const usedSlots = new Set(activity.conversationLogs.map((l) => l.slot));
  const nextSlot = Array.from({ length: 10 }, (_, i) => i).find((i) => !usedSlots.has(i));

  const personName = (await prisma.person.findUnique({ where: { id }, select: { name: true } }))?.name ?? "";

  const [person] = await Promise.all([
    prisma.person.update({
      where: { id },
      data: { lastContactedAt: new Date(), updatedAt: new Date() },
      include: {
        notes: { orderBy: { createdAt: "desc" } },
        Loan: { orderBy: { createdAt: "asc" } },
      },
    }),
    nextSlot !== undefined
      ? prisma.conversationLog.create({
          data: {
            id: randomUUID(),
            dailyActivityId: activity.id,
            contactName: personName,
            personId: id,
            slot: nextSlot,
            tags: [],
          },
        })
      : Promise.resolve(null),
  ]);

  return NextResponse.json({ person, dailyCount: usedSlots.size + (nextSlot !== undefined ? 1 : 0) });
}
