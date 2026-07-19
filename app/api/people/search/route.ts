import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json([]);

  const people = await prisma.person.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      markets: true,
      specializations: true,
      tags: true,
    },
    take: 8,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(people);
}
