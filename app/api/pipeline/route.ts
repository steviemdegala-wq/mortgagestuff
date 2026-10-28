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
  const archived = searchParams.get("view") === "archived";
  const loanWhere = { archivedAt: archived ? { not: null } : null, ...(stage ? { stage } : {}) };

  const contacts = await prisma.person.findMany({
    where: {
      AND: [
        { Loan: { some: loanWhere } },
        search ? { name: { contains: search, mode: "insensitive" } } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      Loan: { where: loanWhere, orderBy: { createdAt: "asc" } },
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
          stage: optionalText(data.stage) ?? "New Lead",
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

function selectedLoanIds(body: { loanIds?: unknown } | null): string[] | null {
  const ids = body?.loanIds;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500 ||
      ids.some((id: unknown) => typeof id !== "string" || !id.trim())) return null;
  return [...new Set<string>(ids)];
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const ids = selectedLoanIds(body);
  if (!ids || !["archive", "restore"].includes(body?.action)) {
    return NextResponse.json({ error: "Select between 1 and 500 loans and choose archive or restore" }, { status: 400 });
  }
  const archive = body.action === "archive";
  const result = await prisma.loan.updateMany({
    where: { id: { in: ids }, archivedAt: archive ? null : { not: null } },
    data: { archivedAt: archive ? new Date() : null },
  });
  return NextResponse.json({ updated: result.count });
}

// Permanent deletion is available only for loans already in the archive.
export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const ids = selectedLoanIds(body);
  if (!ids) {
    return NextResponse.json({ error: "Select between 1 and 500 archived loans" }, { status: 400 });
  }
  const result = await prisma.loan.deleteMany({ where: { id: { in: ids }, archivedAt: { not: null } } });
  return NextResponse.json({ deleted: result.count });
}
