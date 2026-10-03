import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { getAdmin, isAdminUser } from "@/lib/admin";

// GET /api/admin/users?q=text&plan=ALL|FREE|PRO|SUSPENDED&page=1&pageSize=15
export async function GET(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const params = new URL(req.url).searchParams;
  const q = (params.get("q") ?? "").trim().slice(0, 100);
  const plan = params.get("plan") ?? "ALL";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(5, Number(params.get("pageSize")) || 15));

  const filters: Prisma.UserWhereInput[] = [];
  if (q) {
    filters.push({
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (plan === "PRO") filters.push({ plan: "PRO", planStatus: "ACTIVE" });
  if (plan === "FREE") filters.push({ NOT: { plan: "PRO", planStatus: "ACTIVE" } });
  if (plan === "SUSPENDED") filters.push({ suspended: true });

  const where: Prisma.UserWhereInput = filters.length ? { AND: filters } : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        plan: true,
        planStatus: true,
        planRenewsAt: true,
        chatsStarted: true,
        suspended: true,
        createdAt: true,
        _count: { select: { applications: true, payments: true } },
      },
    }),
  ]);

  return NextResponse.json(
    {
      total,
      page,
      pageSize,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        role: u.role,
        isAdmin: isAdminUser(u),
        plan: u.plan,
        planStatus: u.planStatus,
        planRenewsAt: u.planRenewsAt,
        chatsStarted: u.chatsStarted,
        suspended: u.suspended,
        createdAt: u.createdAt,
        applicationsCount: u._count.applications,
        paymentsCount: u._count.payments,
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}