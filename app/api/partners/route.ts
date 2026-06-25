import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const market = searchParams.get("market") ?? "";
  const spec = searchParams.get("spec") ?? "";

  const partners = await prisma.referralPartner.findMany({
    where: {
      AND: [
        search
          ? { name: { contains: search, mode: "insensitive" } }
          : {},
        market ? { markets: { has: market } } : {},
        spec ? { specializations: { has: spec } } : {},
      ],
    },
    orderBy: { name: "asc" },
    include: { _count: { select: { notes: true } } },
  });

  return NextResponse.json(partners);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const partner = await prisma.referralPartner.create({
      data: {
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        birthday: data.birthday ? new Date(data.birthday) : null,
        role: data.role ?? null,
        markets: data.markets ?? [],
        specializations: data.specializations ?? [],
      },
    });

    return NextResponse.json(partner, { status: 201 });
  } catch (err) {
    console.error("POST /api/partners error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
