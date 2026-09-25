import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function optionalText(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text || null;
}

function loanAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

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

export async function POST(request: NextRequest) {
  const data = await request.json();
  const name = optionalText(data.name);

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const type = optionalText(data.loanType) ?? "Website inquiry";
  const summary = optionalText(data.notes);
  const requestedTags = Array.isArray(data.tags)
    ? data.tags.filter((tag: unknown): tag is string => typeof tag === "string" && Boolean(tag.trim()))
    : [];
  const tags = Array.from(new Set(["Website", ...requestedTags.map((tag: string) => tag.trim())]));

  const person = await prisma.person.create({
    data: {
      name,
      email: optionalText(data.email),
      phone: optionalText(data.phone),
      role: optionalText(data.role) ?? "Borrower",
      tags,
      stage: optionalText(data.stage) ?? "New Lead",
      loanAmount: loanAmount(data.loanAmount),
      Loan: {
        create: {
          name: `${name} - ${type}`,
          loanAmount: loanAmount(data.loanAmount),
          loanType: type,
          notes: summary,
        },
      },
      ...(summary
        ? {
            notes: {
              create: { body: summary },
            },
          }
        : {}),
    },
    include: {
      Loan: true,
      notes: true,
    },
  });

  return NextResponse.json(person, { status: 201 });
}
