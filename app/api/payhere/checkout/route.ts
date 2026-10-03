import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/db";
import { authOptions } from "../../auth/[...nextauth]/route";
import {
  PAYHERE_CHECKOUT_URL,
  PLAN,
  formatAmount,
  getPayHereCredentials,
  signCheckout,
} from "@/lib/payhere";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.suspended) {
      return NextResponse.json({ error: "Your account has been suspended." }, { status: 403 });
    }

    if (user.plan === "PRO" && user.planStatus === "ACTIVE") {
      return NextResponse.json({ error: "You already have an active plan." }, { status: 409 });
    }

    // One Payment row per checkout attempt; its id is the PayHere order_id
    const payment = await prisma.payment.create({
      data: { userId: user.id, amount: PLAN.amount, currency: PLAN.currency },
    });

    const { merchantId } = getPayHereCredentials();
    const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
    // PayHere must be able to reach this URL (use ngrok / a preview URL while testing locally)
    const notifyUrl = process.env.PAYHERE_NOTIFY_URL || `${baseUrl}/api/payhere/notify`;

    const fullName = (user.name || session.user?.name || "Doctor Bank User").trim();
    const [firstName, ...rest] = fullName.split(" ");

    const fields: Record<string, string> = {
      merchant_id: merchantId,
      return_url: `${baseUrl}/dashboard?payment=returned`,
      cancel_url: `${baseUrl}/#pricing`,
      notify_url: notifyUrl,
      order_id: payment.id,
      items: PLAN.name,
      currency: PLAN.currency,
      amount: formatAmount(PLAN.amount),
      first_name: firstName || "User",
      last_name: rest.join(" ") || "-",
      email,
      // PayHere requires these fields; we don't collect them, so placeholders are sent
      phone: "0000000000",
      address: "Not provided",
      city: "Not provided",
      country: "Sri Lanka",
      recurrence: PLAN.recurrence,
      duration: PLAN.duration,
      hash: signCheckout(payment.id, PLAN.amount, PLAN.currency),
    };

    return NextResponse.json({ url: PAYHERE_CHECKOUT_URL, fields });
  } catch (error) {
    console.error("PayHere checkout error:", error);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}