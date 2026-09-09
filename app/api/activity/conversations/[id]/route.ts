import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.conversationLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  const updated = await prisma.conversationLog.update({
    where: { id },
    data: {
      ...(data.contactName !== undefined && { contactName: data.contactName }),
      ...(data.personId !== undefined && { personId: data.personId }),
      ...(data.tags !== undefined && { tags: data.tags }),
    },
  });

  // Update lastContactedAt on the Person
  if (updated.personId) {
    await prisma.person.update({
      where: { id: updated.personId },
      data: { lastContactedAt: new Date(), updatedAt: new Date() },
    });
  }

  // Manually attach Person since no FK relation in schema
  const person = updated.personId
    ? await prisma.person.findUnique({ where: { id: updated.personId } })
    : null;

  return NextResponse.json({ ...updated, Person: person });
}
