import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const people = await prisma.person.findMany({
    where: {
      OR: [
        { lastContactedAt: null },
        { lastContactedAt: { lt: thirtyDaysAgo } },
      ],
    },
    orderBy: [
      { lastContactedAt: "asc" },
    ],
    select: {
      id: true,
      name: true,
      role: true,
      lastContactedAt: true,
    },
    take: 10,
  });

  return NextResponse.json(people);
}
