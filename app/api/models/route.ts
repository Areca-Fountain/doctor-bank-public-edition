import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { availableModels } from "@/lib/aiModels";

export const dynamic = "force-dynamic";

// Tells the chat page which models are configured, so the picker never shows a model that would fail
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ models: [] }, { status: 401 });
  return NextResponse.json({ models: availableModels() });
}