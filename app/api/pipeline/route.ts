import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const stage = searchParams.get("stage") ?? "";

  const contacts = await prisma.pipelineContact.findMany({
    where: {
      AND: [
        search
          ? { name: { contains: search, mode: "insensitive" } }
          : {},
        stage ? { stage } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { notes: true } } },
  });

  return NextResponse.json(contacts);
}

export async function POST(request: NextRequest) {
  const data = await request.json();

  const contact = await prisma.pipelineContact.create({
    data: {
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      mailingAddress: data.mailingAddress ?? null,
      occupation: data.occupation ?? null,
      birthday: data.birthday ? new Date(data.birthday) : null,
      stage: data.stage ?? null,
      loanAmount: data.loanAmount ? parseFloat(data.loanAmount) : null,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
