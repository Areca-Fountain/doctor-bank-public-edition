import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { FREE_CHAT_LIMIT, FREE_MESSAGE_LIMIT, isProUser } from "@/lib/plans";

const noStore = { "Cache-Control": "no-store" };

// Everything the Settings page shows about the signed-in user.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const savedChats = await prisma.application.count({ where: { userId: user.id } });
    const isPro = isProUser(user);

    return NextResponse.json(
      {
        name: user.name ?? session.user?.name ?? null,
        email: user.email,
        image: user.image ?? session.user?.image ?? null,
        memberSince: user.createdAt,
        plan: isPro ? "PRO" : "FREE",
        planStatus: user.planStatus,
        renewsAt: user.plan === "PRO" ? user.planRenewsAt : null,
        paidPlanActive: user.plan === "PRO" && user.planStatus === "ACTIVE",
        chatsUsed: user.chatsStarted,
        chatsLimit: FREE_CHAT_LIMIT,
        messagesLimit: FREE_MESSAGE_LIMIT,
        savedChats,
      },
      { headers: noStore }
    );
  } catch (error) {
    console.error("GET settings/account error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Permanently deletes the signed-in user. Chats, saved PDFs, linked Google sign-in and
// payment records are removed with them (the database relations are set to cascade).
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.email) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const typed = typeof body?.confirmEmail === "string" ? body.confirmEmail.trim().toLowerCase() : "";
    if (typed !== user.email.toLowerCase()) {
      return NextResponse.json({ error: "The email you typed doesn't match your account." }, { status: 400 });
    }

    // A live subscription keeps charging after the account is gone, so stop it first.
    if (user.plan === "PRO" && user.planStatus === "ACTIVE") {
      return NextResponse.json(
        {
          error:
            "You have an active Full House subscription. Cancel it with PayHere (or ask support to cancel it) before deleting your profile, so you aren't charged again.",
        },
        { status: 409 }
      );
    }

    await prisma.user.delete({ where: { id: user.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE settings/account error:", error);
    return NextResponse.json({ error: "Could not delete your profile. Please try again." }, { status: 500 });
  }
}
