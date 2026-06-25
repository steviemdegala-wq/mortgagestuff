import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface BirthdayEntry {
  id: string;
  name: string;
  birthday: Date;
  type: "partner" | "pipeline";
  daysUntil: number;
}

function daysUntilNextBirthday(birthday: Date): number {
  const today = new Date();
  const thisYear = new Date(
    today.getFullYear(),
    birthday.getMonth(),
    birthday.getDate()
  );
  if (thisYear < today) {
    thisYear.setFullYear(today.getFullYear() + 1);
  }
  const diff = thisYear.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export async function GET() {
  const [partners, pipeline] = await Promise.all([
    prisma.referralPartner.findMany({
      where: { birthday: { not: null } },
      select: { id: true, name: true, birthday: true },
    }),
    prisma.pipelineContact.findMany({
      where: { birthday: { not: null } },
      select: { id: true, name: true, birthday: true },
    }),
  ]);

  const entries: BirthdayEntry[] = [];

  for (const p of partners) {
    if (!p.birthday) continue;
    const daysUntil = daysUntilNextBirthday(p.birthday);
    if (daysUntil <= 30) {
      entries.push({ id: p.id, name: p.name, birthday: p.birthday, type: "partner", daysUntil });
    }
  }

  for (const c of pipeline) {
    if (!c.birthday) continue;
    const daysUntil = daysUntilNextBirthday(c.birthday);
    if (daysUntil <= 30) {
      entries.push({ id: c.id, name: c.name, birthday: c.birthday, type: "pipeline", daysUntil });
    }
  }

  entries.sort((a, b) => a.daysUntil - b.daysUntil);

  return NextResponse.json(entries);
}
