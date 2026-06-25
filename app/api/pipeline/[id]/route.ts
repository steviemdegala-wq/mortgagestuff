import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const contact = await prisma.pipelineContact.findUnique({
    where: { id },
    include: { notes: { orderBy: { createdAt: "desc" } } },
  });

  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(contact);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  const updated = await prisma.pipelineContact.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.mailingAddress !== undefined && {
        mailingAddress: data.mailingAddress || null,
      }),
      ...(data.occupation !== undefined && { occupation: data.occupation || null }),
      ...(data.birthday !== undefined && {
        birthday: data.birthday ? new Date(data.birthday) : null,
      }),
      ...(data.stage !== undefined && { stage: data.stage || null }),
    },
    include: { notes: { orderBy: { createdAt: "desc" } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.pipelineContact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
