import { NextRequest, NextResponse } from "next/server";

// Pipeline contacts have been merged into /api/people — redirect all requests there
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.redirect(new URL(`/api/people/${id}`, _req.url));
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.redirect(new URL(`/api/people/${id}`, req.url), { status: 308 });
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.redirect(new URL(`/api/people/${id}`, req.url), { status: 308 });
}
