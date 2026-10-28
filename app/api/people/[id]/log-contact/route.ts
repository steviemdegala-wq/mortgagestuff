import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { personProfileInclude } from "@/lib/person-profile";

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

  const result = await prisma.$transaction(async (tx) => {
    const contact = await tx.person.findUnique({ where: { id }, select: { name: true } });
    if (!contact) return { error: "Person not found.", status: 404 } as const;

    // Updating this shared row serializes profile logs for the same day.
    const activity = await tx.dailyActivity.upsert({
      where: { date },
      update: { updatedAt: new Date() },
      create: { date },
      include: { conversationLogs: { select: { slot: true } } },
    });
    // The dashboard uses slots 1–10, not 0–9.
    const usedSlots = new Set(activity.conversationLogs.map((log) => log.slot));
    const nextSlot = Array.from({ length: 10 }, (_, i) => i + 1).find((slot) => !usedSlots.has(slot));
    if (nextSlot === undefined) {
      return { error: "Today's 10 conversation slots are full. Review today's conversations on the dashboard.", status: 409 } as const;
    }

    await tx.conversationLog.create({
      data: {
        dailyActivityId: activity.id,
        contactName: contact.name,
        personId: id,
        slot: nextSlot,
        tags: [],
      },
    });
    const dailyLog = await tx.dailyLog.findUnique({ where: { date } });
    const dailyCount = Math.max(dailyLog?.count ?? 0, nextSlot, ...activity.conversationLogs.map((log) => log.slot));
    await tx.dailyLog.upsert({
      where: { date },
      update: { count: dailyCount },
      create: { date, count: dailyCount },
    });
    const person = await tx.person.update({
      where: { id },
      data: { lastContactedAt: new Date() },
      include: personProfileInclude,
    });
    return { person, dailyCount };
  }, { timeout: 15000 });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
