import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  const updated = await prisma.loan.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.loanAmount !== undefined && { loanAmount: parseFloat(data.loanAmount) }),
      ...(data.loanType !== undefined && { loanType: data.loanType }),
      ...(data.targetRate !== undefined && { targetRate: data.targetRate ? parseFloat(data.targetRate) : null }),
      ...(data.pricingRate !== undefined && { pricingRate: data.pricingRate ? parseFloat(data.pricingRate) : null }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.expectedCloseDate !== undefined && {
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
      }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.loan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
