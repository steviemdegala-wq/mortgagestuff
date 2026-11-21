"use server";

import { getIronSession } from "iron-session";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { type SessionData, sessionOptions } from "@/lib/session";
import { TOP_CLIENT_COUNT } from "@/lib/top-clients";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value: string, label: string, max: number, decimals: number) {
  if (!value) return null;
  const number = Number(value);
  const pattern = decimals ? new RegExp(`^\\d+(?:\\.\\d{1,${decimals}})?$`) : /^\d+$/;
  if (!pattern.test(value) || !Number.isFinite(number) || number > max) {
    throw new Error(`Enter a valid ${label} between 0 and ${max.toLocaleString("en-US")}.`);
  }
  return number;
}

export async function saveTopClient(
  rank: number,
  _previous: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) redirect("/login");
  if (!Number.isInteger(rank) || rank < 1 || rank > TOP_CLIENT_COUNT) return "Choose a rank from 1 to 10.";

  try {
    if (formData.get("intent") === "remove") {
      await prisma.topClient.deleteMany({ where: { rank } });
    } else {
      const name = readText(formData, "name");
      const industry = readText(formData, "industry");
      if (!name || name.length > 150 || industry.length > 150) {
        return "Enter a client name. Client name and industry can each have up to 150 characters.";
      }

      let projections;
      try {
        projections = {
          expectedDeals: readNumber(readText(formData, "expectedDeals"), "expected deal count", 100_000, 0),
          averageDealSize: readNumber(readText(formData, "averageDealSize"), "average deal size", 1_000_000_000, 2),
          commissionRate: readNumber(readText(formData, "commissionRate"), "commission percentage", 100, 3),
          annualValueOverride: readNumber(readText(formData, "annualValueOverride"), "annual value", 1_000_000_000, 2),
        };
      } catch (error) {
        return (error as Error).message;
      }

      const contactIds = [...new Set(formData.getAll("contactIds"))];
      if (!contactIds.every((id) => typeof id === "string")) return "Choose contacts from People.";
      const contacts = contactIds.map((id) => ({ id }));
      if (contactIds.length && await prisma.person.count({ where: { id: { in: contactIds } } }) !== contacts.length) {
        return "One or more linked contacts could not be found. Refresh the page and choose them again.";
      }

      const data = { name, industry: industry || null, ...projections };
      await prisma.topClient.upsert({
        where: { rank },
        create: { rank, ...data, contacts: { connect: contacts } },
        update: { ...data, contacts: { set: contacts } },
      });
    }
  } catch (error) {
    console.error("Unable to update Top 10 client", error);
    return "The change could not be saved. Try again.";
  }

  revalidatePath("/top-10");
  redirect("/top-10");
}
