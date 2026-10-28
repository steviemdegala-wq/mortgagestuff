import { redirect } from "next/navigation";

// Older dashboard links should open the current People profile and its actions.
export default async function PartnerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/people/${id}`);
}
