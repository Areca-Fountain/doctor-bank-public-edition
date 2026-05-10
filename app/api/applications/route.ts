import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/db";

// GET: Fetch chats (Either ALL for dashboard, or a SINGLE one for the chat screen)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    // IF CONTINUING A CHAT: Return the specific chat history & PDF
    if (id) {
      const application = await prisma.application.findUnique({
        where: { id: id, userId: user.id },
      });
      return NextResponse.json(application);
    }

    // IF ON DASHBOARD: Fetch list of applications
    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        pdfName: true,
        createdAt: true,
      }
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("GET Applications Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Handle both "Delete Single Chat" and "Delete All"
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all");

    if (all === "true") {
      await prisma.application.deleteMany({
        where: { userId: user.id }
      });
      return NextResponse.json({ message: "All chats deleted successfully" });
    }

    if (id) {
      await prisma.application.delete({
        where: { id: id, userId: user.id } 
      });
      return NextResponse.json({ message: "Chat deleted successfully" });
    }

    return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });

  } catch (error) {
    console.error("DELETE Applications Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}