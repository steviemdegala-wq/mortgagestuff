import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { body, personId } = await request.json();

  if (!body || !personId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: { body, personId },
  });

  return NextResponse.json(note, { status: 201 });
}
