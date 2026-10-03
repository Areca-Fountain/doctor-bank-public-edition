import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAdmin, isAdminUser, isEnvAdmin, logAdminAction } from "@/lib/admin";

type RouteContext = { params: Promise<{ id: string }> };

const ACTIONS = [
  "SET_PRO",
  "SET_FREE",
  "RESET_CHATS",
  "SUSPEND",
  "UNSUSPEND",
  "MAKE_ADMIN",
  "REMOVE_ADMIN",
] as const;
type Action = (typeof ACTIONS)[number];

// ---------- GET: full details for one user ----------
export async function GET(_req: Request, { params }: RouteContext) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 20 },
      applications: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, pdfName: true, createdAt: true },
      },
      _count: { select: { applications: true, payments: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      isAdmin: isAdminUser(user),
      isEnvAdmin: isEnvAdmin(user.email),
      plan: user.plan,
      planStatus: user.planStatus,
      planRenewsAt: user.planRenewsAt,
      hasSubscription: !!user.payhereSubscriptionId,
      chatsStarted: user.chatsStarted,
      suspended: user.suspended,
      createdAt: user.createdAt,
      applicationsCount: user._count.applications,
      paymentsCount: user._count.payments,
      payments: user.payments.map((p) => ({
        id: p.id,
        amount: p.amount.toString(),
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt,
      })),
      applications: user.applications,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// ---------- PATCH: run an admin action on a user ----------
export async function PATCH(req: Request, { params }: RouteContext) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string; days?: number };
  const action = body.action as Action;
  if (!ACTIONS.includes(action)) return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isSelf = target.id === admin.id;
  const targetIsAdmin = isAdminUser(target);

  // Safety rules so an admin can't lock themselves or the team out
  if (action === "SUSPEND" && (isSelf || targetIsAdmin)) {
    return NextResponse.json({ error: "Admins can't be suspended. Remove admin access first." }, { status: 400 });
  }
  if (action === "REMOVE_ADMIN") {
    if (isEnvAdmin(target.email)) {
      return NextResponse.json({ error: "This admin is set in ADMIN_EMAILS. Remove them there." }, { status: 400 });
    }
    if (isSelf) return NextResponse.json({ error: "You can't remove your own admin access." }, { status: 400 });
  }

  let data: Record<string, string | number | boolean | Date | null> = {};
  let details: Record<string, string | number | boolean | null> = {};

  switch (action) {
    case "SET_PRO": {
      const days = Math.min(365, Math.max(1, Math.round(Number(body.days) || 30)));
      data = { plan: "PRO", planStatus: "ACTIVE", planRenewsAt: new Date(Date.now() + days * 86400000) };
      details = { days };
      break;
    }
    case "SET_FREE":
      // Note: this does not cancel a PayHere subscription. The customer is still billed until it is stopped.
      data = {
        plan: "FREE",
        planStatus: target.payhereSubscriptionId ? "CANCELLED" : "NONE",
        planRenewsAt: null,
      };
      details = { hadSubscription: !!target.payhereSubscriptionId };
      break;
    case "RESET_CHATS":
      data = { chatsStarted: 0 };
      details = { previous: target.chatsStarted };
      break;
    case "SUSPEND":
      data = { suspended: true };
      break;
    case "UNSUSPEND":
      data = { suspended: false };
      break;
    case "MAKE_ADMIN":
      data = { role: "ADMIN" };
      break;
    case "REMOVE_ADMIN":
      data = { role: "USER" };
      break;
  }

  await prisma.user.update({ where: { id }, data });
  await logAdminAction({
    adminEmail: admin.email ?? "unknown",
    action,
    targetUserId: target.id,
    targetEmail: target.email,
    details,
  });

  return NextResponse.json({ ok: true });
}

// ---------- DELETE: remove a user and everything they own ----------
export async function DELETE(_req: Request, { params }: RouteContext) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const target = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { applications: true, payments: true } } },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (target.id === admin.id) {
    return NextResponse.json({ error: "You can't delete your own account here." }, { status: 400 });
  }
  if (isAdminUser(target)) {
    return NextResponse.json({ error: "Remove admin access before deleting this user." }, { status: 400 });
  }

  // Accounts, sessions, applications and payments are deleted with the user (cascade)
  await prisma.user.delete({ where: { id } });
  await logAdminAction({
    adminEmail: admin.email ?? "unknown",
    action: "DELETE_USER",
    targetUserId: target.id,
    targetEmail: target.email,
    details: {
      applications: target._count.applications,
      payments: target._count.payments,
      hadSubscription: !!target.payhereSubscriptionId,
    },
  });

  return NextResponse.json({ ok: true });
}