import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const people = await prisma.person.findMany({
    where: { followUpDate: { lte: todayEnd } },
    orderBy: { followUpDate: "asc" },
    select: {
      id: true,
      name: true,
      role: true,
      phone: true,
      followUpDate: true,
      lastContactedAt: true,
    },
  });

  return NextResponse.json(people);
}
