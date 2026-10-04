import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { allModels } from "@/lib/aiModels";

export const dynamic = "force-dynamic";

// Every AI model Doctor Bank knows about, and whether it is switched on (its API key exists).
// The user's choice is stored in their browser (the same place the chat dropdown uses),
// so this route only lists models and never sees any keys.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ models: [] }, { status: 401 });
  return NextResponse.json({ models: allModels() }, { headers: { "Cache-Control": "no-store" } });
}
