import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PAYHERE_MODE } from "@/lib/payhere";

export const runtime = "nodejs";

const API_BASE = PAYHERE_MODE === "live" ? "https://www.payhere.lk" : "https://sandbox.payhere.lk";

// Gets a short-lived token for the PayHere Subscription Manager API.
// Needs PAYHERE_APP_ID and PAYHERE_APP_SECRET (PayHere dashboard -> Settings -> API Keys).
async function getAccessToken() {
  const appId = process.env.PAYHERE_APP_ID;
  const appSecret = process.env.PAYHERE_APP_SECRET;
  if (!appId || !appSecret) throw new Error("PAYHERE_APP_ID / PAYHERE_APP_SECRET are not set");

  const res = await fetch(`${API_BASE}/merchant/v1/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${appId}:${appSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error("Could not get a PayHere access token");
  return data.access_token as string;
}

// Cancels the signed-in user's Full House subscription with PayHere so they are not charged again.
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.plan !== "PRO" || user.planStatus !== "ACTIVE") {
      return NextResponse.json({ error: "You don't have an active subscription to cancel." }, { status: 409 });
    }
    if (!user.payhereSubscriptionId) {
      // No PayHere subscription saved. If the user never paid through PayHere, the plan was
      // given manually (e.g. by an admin), so there is nothing to cancel at PayHere: just end it here.
      const paid = await prisma.payment.count({ where: { userId: user.id, status: "SUCCESS" } });
      if (paid === 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: "FREE", planStatus: "CANCELLED", planRenewsAt: null },
        });
        return NextResponse.json({ success: true });
      }
      return NextResponse.json(
        { error: "We couldn't find your subscription ID. Please contact support to cancel it." },
        { status: 409 }
      );
    }

    const token = await getAccessToken();
    const res = await fetch(`${API_BASE}/merchant/v1/subscription/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ subscription_id: user.payhereSubscriptionId }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status !== 1) {
      console.error("PayHere cancel failed:", res.status, data);
      return NextResponse.json(
        { error: "PayHere could not cancel the subscription. Please try again or contact support." },
        { status: 502 }
      );
    }

    // Same result as PayHere's RECURRING_STOPPED notification
    await prisma.user.update({
      where: { id: user.id },
      data: { plan: "FREE", planStatus: "CANCELLED", planRenewsAt: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE settings/subscription error:", error);
    return NextResponse.json({ error: "Could not cancel your subscription. Please try again." }, { status: 500 });
  }
}
