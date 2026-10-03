import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAdmin } from "@/lib/admin";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const logs = await prisma.adminLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ logs }, { headers: { "Cache-Control": "no-store" } });
}