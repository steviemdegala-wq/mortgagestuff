import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function daysUntilNextBirthday(birthday: Date): number {
  const today = new Date();
  const thisYear = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
  if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
  return Math.ceil((thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET() {
  const people = await prisma.person.findMany({
    where: { birthday: { not: null } },
    select: { id: true, name: true, birthday: true },
  });

  const entries = people
    .filter((p) => p.birthday != null)
    .map((p) => ({ id: p.id, name: p.name, birthday: p.birthday!, daysUntil: daysUntilNextBirthday(p.birthday!) }))
    .filter((e) => e.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return NextResponse.json(entries);
}
