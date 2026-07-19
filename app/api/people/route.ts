import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const stage = searchParams.get("stage") ?? "";

  const people = await prisma.person.findMany({
    where: {
      AND: [
        search ? { name: { contains: search, mode: "insensitive" } } : {},
        tag ? { tags: { has: tag } } : {},
        stage ? { stage } : {},
      ],
    },
    orderBy: { name: "asc" },
    include: { _count: { select: { notes: true } } },
  });

  return NextResponse.json(people);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  if (!data.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const person = await prisma.person.create({
    data: {
      name: data.name.trim(),
      email: data.email ?? null,
      phone: data.phone ?? null,
      role: data.role ?? null,
      tags: data.tags ?? [],
      stage: data.stage ?? null,
    },
  });

  return NextResponse.json(person, { status: 201 });
}
