import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const partner = await prisma.referralPartner.findUnique({
    where: { id },
    include: { notes: { orderBy: { createdAt: "desc" } } },
  });

  if (!partner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(partner);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  const updated = await prisma.referralPartner.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.birthday !== undefined && {
        birthday: data.birthday ? new Date(data.birthday) : null,
      }),
      ...(data.role !== undefined && { role: data.role || null }),
      ...(data.markets !== undefined && { markets: data.markets }),
      ...(data.specializations !== undefined && {
        specializations: data.specializations,
      }),
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
  await prisma.referralPartner.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
