import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const stage = searchParams.get("stage") ?? "";

  const contacts = await prisma.person.findMany({
    where: {
      AND: [
        { Loan: { some: {} } },
        search ? { name: { contains: search, mode: "insensitive" } } : {},
        stage ? { stage } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      Loan: { orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json(contacts);
}
