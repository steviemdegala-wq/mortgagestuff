import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function todayDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [partner, log] = await Promise.all([
    prisma.referralPartner.update({
      where: { id },
      data: { lastContactedAt: new Date() },
      include: { notes: { orderBy: { createdAt: "desc" } } },
    }),
    prisma.dailyLog.upsert({
      where: { date: todayDate() },
      update: { count: { increment: 1 } },
      create: { date: todayDate(), count: 1 },
    }),
  ]);

  return NextResponse.json({ partner, dailyCount: log.count });
}
