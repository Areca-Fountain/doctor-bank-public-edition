import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin";

// Lets the navbar know whether to show the Admin link. Never reveals anything else.
export async function GET() {
  const admin = await getAdmin();
  return NextResponse.json({ isAdmin: !!admin }, { headers: { "Cache-Control": "no-store" } });
}