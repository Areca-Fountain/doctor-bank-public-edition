import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/db";
import { authOptions } from "../auth/[...nextauth]/route";
import { FREE_CHAT_LIMIT, FREE_MESSAGE_LIMIT, isProUser } from "@/lib/plans";

// Returns the current user's plan and how much of the Free allowance they have used.
// GET /api/usage            -> account level (chats used)
// GET /api/usage?id=<chat>  -> also counts the messages sent in that chat
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isPro = isProUser(user);

    const chatId = new URL(req.url).searchParams.get("id");
    let messagesUsed = 0;
    if (chatId) {
      const application = await prisma.application.findFirst({
        where: { id: chatId, userId: user.id },
        select: { chatHistory: true },
      });
      if (application && Array.isArray(application.chatHistory)) {
        messagesUsed = application.chatHistory.filter(
          (m) => !!m && typeof m === "object" && (m as { role?: unknown }).role === "user"
        ).length;
      }
    }

    return NextResponse.json(
      {
        plan: isPro ? "PRO" : "FREE",
        chatsUsed: user.chatsStarted,
        chatsLimit: FREE_CHAT_LIMIT,
        messagesUsed,
        messagesLimit: FREE_MESSAGE_LIMIT,
        renewsAt: isPro ? user.planRenewsAt : null,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET usage error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}