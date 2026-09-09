import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const data = await request.json();

  const loan = await prisma.loan.create({
    data: {
      name: data.name,
      loanAmount: parseFloat(data.loanAmount),
      loanType: data.loanType,
      targetRate: data.targetRate ? parseFloat(data.targetRate) : null,
      pricingRate: data.pricingRate ? parseFloat(data.pricingRate) : null,
      notes: data.notes || null,
      expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
      personId: data.personId,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(loan, { status: 201 });
}
