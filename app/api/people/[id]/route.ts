import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const person = await prisma.person.findUnique({
    where: { id },
    include: { notes: { orderBy: { createdAt: "desc" } } },
  });
  if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(person);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  const updated = await prisma.person.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.birthday !== undefined && { birthday: data.birthday ? new Date(data.birthday) : null }),
      ...(data.role !== undefined && { role: data.role || null }),
      ...(data.mailingAddress !== undefined && { mailingAddress: data.mailingAddress || null }),
      ...(data.markets !== undefined && { markets: data.markets }),
      ...(data.specializations !== undefined && { specializations: data.specializations }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.stage !== undefined && { stage: data.stage || null }),
      ...(data.loanAmount !== undefined && { loanAmount: data.loanAmount != null ? parseFloat(data.loanAmount) : null }),
      ...(data.followUpDate !== undefined && { followUpDate: data.followUpDate ? new Date(data.followUpDate) : null }),
      ...(data.lastContactedAt !== undefined && { lastContactedAt: data.lastContactedAt ? new Date(data.lastContactedAt) : null }),
    },
    include: { notes: { orderBy: { createdAt: "desc" } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.person.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
