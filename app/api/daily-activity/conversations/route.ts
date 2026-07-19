import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

async function getOrCreateActivity(date: Date) {
  return prisma.dailyActivity.upsert({
    where: { date },
    update: {},
    create: { date },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { contactName, personId, date: dateParam, slot, tags } = body;
  if (!contactName?.trim()) {
    return NextResponse.json({ error: "contactName required" }, { status: 400 });
  }
  const date = dateParam ? new Date(dateParam + "T00:00:00Z") : todayUTC();
  const activity = await getOrCreateActivity(date);

  const log = await prisma.conversationLog.create({
    data: {
      dailyActivityId: activity.id,
      contactName: contactName.trim(),
      slot: slot ?? 0,
      tags: tags ?? [],
      personId: personId ?? null,
    },
  });

  return NextResponse.json(log, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, contactName, personId, tags } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const log = await prisma.conversationLog.update({
    where: { id },
    data: {
      ...(contactName !== undefined && { contactName: contactName.trim() }),
      ...(personId !== undefined && { personId }),
      ...(tags !== undefined && { tags }),
    },
  });

  return NextResponse.json(log);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.conversationLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
