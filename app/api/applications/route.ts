import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/db";

// GET: Fetch all saved chats for the logged-in user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the user's ID
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Fetch their applications, ordered by newest first
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

    // If 'all=true' is passed, delete everything for this user
    if (all === "true") {
      await prisma.application.deleteMany({
        where: { userId: user.id }
      });
      return NextResponse.json({ message: "All chats deleted successfully" });
    }

    // Otherwise, delete the specific ID
    if (id) {
      await prisma.application.delete({
        where: { id: id, userId: user.id } // Ensures users can only delete their own chats
      });
      return NextResponse.json({ message: "Chat deleted successfully" });
    }

    return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });

  } catch (error) {
    console.error("DELETE Applications Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}