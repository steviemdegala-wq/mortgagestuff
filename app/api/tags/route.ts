import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SEED_MARKETS = ["Northern Colorado", "East Texas", "Utah"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "tags";

  const people = await prisma.person.findMany({
    select: { tags: true, markets: true, specializations: true },
  });

  const tagSet = new Set<string>();

  if (type === "markets") {
    for (const m of SEED_MARKETS) tagSet.add(m);
    for (const p of people) for (const m of p.markets) tagSet.add(m);
  } else if (type === "specializations") {
    for (const p of people) for (const s of p.specializations) tagSet.add(s);
  } else {
    for (const p of people) for (const t of p.tags) tagSet.add(t);
  }

  return NextResponse.json(Array.from(tagSet).sort());
}
