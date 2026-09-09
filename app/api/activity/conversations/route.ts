import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const { dailyActivityId, contactName, personId, slot, tags } = await request.json();

  const log = await prisma.conversationLog.create({
    data: {
      id: randomUUID(),
      dailyActivityId,
      contactName: contactName ?? "",
      personId: personId ?? null,
      slot: slot ?? 0,
      tags: tags ?? [],
    },
  });

  // Update lastContactedAt on the Person
  if (personId) {
    await prisma.person.update({
      where: { id: personId },
      data: { lastContactedAt: new Date(), updatedAt: new Date() },
    });
  }

  const person = personId ? await prisma.person.findUnique({ where: { id: personId } }) : null;

  return NextResponse.json({ ...log, Person: person }, { status: 201 });
}
