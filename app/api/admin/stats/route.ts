import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAdmin } from "@/lib/admin";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, newUsers7d, proUsers, suspendedUsers, totalChats, paidCheckouts] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { plan: "PRO", planStatus: "ACTIVE" } }),
    prisma.user.count({ where: { suspended: true } }),
    prisma.application.count(),
    prisma.payment.count({ where: { status: "SUCCESS" } }),
  ]);

  return NextResponse.json(
    {
      totalUsers,
      newUsers7d,
      proUsers,
      freeUsers: totalUsers - proUsers,
      suspendedUsers,
      totalChats,
      paidCheckouts,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}