import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isProUser } from "@/lib/plans";
import { MODEL_COOKIE, MODEL_OPTIONS, isValidModelId } from "@/lib/ai-models";

const noStore = { "Cache-Control": "no-store" };

async function getUser() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  return prisma.user.findUnique({ where: { email } });
}

// The model this user has picked (or "default").
export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isPro = isProUser(user);
    const saved = (await cookies()).get(MODEL_COOKIE)?.value;
    const option = MODEL_OPTIONS.find((o) => o.id === saved);
    // A model the user can no longer use shows as "default", which is what chat will really use
    const selected = option && (!option.proOnly || isPro) ? option.id : "default";

    return NextResponse.json({ selected, isPro }, { headers: noStore });
  } catch (error) {
    console.error("GET settings/model error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Save a new choice. The chat API reads this cookie on every message.
export async function PUT(req: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const model = body?.model;
    if (!isValidModelId(model)) {
      return NextResponse.json({ error: "That model isn't available." }, { status: 400 });
    }

    const option = MODEL_OPTIONS.find((o) => o.id === model)!;
    if (option.proOnly && !isProUser(user)) {
      return NextResponse.json({ error: "This model is part of the Full House plan." }, { status: 403 });
    }

    const res = NextResponse.json({ selected: model });
    res.cookies.set(MODEL_COOKIE, model, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  } catch (error) {
    console.error("PUT settings/model error:", error);
    return NextResponse.json({ error: "Could not save your choice." }, { status: 500 });
  }
}
