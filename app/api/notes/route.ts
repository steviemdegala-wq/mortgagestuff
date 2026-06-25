import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { body, referralPartnerId, pipelineContactId } = await request.json();

  if (!body || (!referralPartnerId && !pipelineContactId)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: {
      body,
      ...(referralPartnerId && { referralPartnerId }),
      ...(pipelineContactId && { pipelineContactId }),
    },
  });

  return NextResponse.json(note, { status: 201 });
}
