import prisma from "@/lib/db";
import { verifyNotification } from "@/lib/payhere";

export const runtime = "nodejs";

// Simple check so you can open the tunnel URL in a browser and confirm the route is reachable.
export async function GET() {
  return new Response("PayHere notify endpoint is up", { status: 200 });
}

// Fields we never print to the terminal
const REDACTED_FIELDS = ["md5sig", "card_holder_name", "card_no", "card_expiry"];

// PayHere calls this server-to-server after every payment event.
// This is the ONLY place that should grant or remove the paid plan.
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const get = (key: string) => String(form.get(key) ?? "");

    // Development only: show what PayHere sent (sensitive fields hidden)
    if (process.env.NODE_ENV !== "production") {
      const safe: Record<string, string> = {};
      form.forEach((value, key) => {
        safe[key] = REDACTED_FIELDS.includes(key) ? "[hidden]" : String(value);
      });
      console.log("[payhere:notify] received", safe);
    }

    const orderId = get("order_id");
    const statusCode = get("status_code");
    const payhereAmount = get("payhere_amount");
    const payhereCurrency = get("payhere_currency");

    const valid = verifyNotification({
      merchant_id: get("merchant_id"),
      order_id: orderId,
      payhere_amount: payhereAmount,
      payhere_currency: payhereCurrency,
      status_code: statusCode,
      md5sig: get("md5sig"),
    });
    if (!valid) {
      console.error("[payhere:notify] invalid signature for order", orderId);
      return new Response("Invalid signature", { status: 400 });
    }

    const payment = await prisma.payment.findUnique({ where: { id: orderId } });
    if (!payment) {
      console.error("[payhere:notify] unknown order", orderId);
      return new Response("Unknown order", { status: 404 });
    }

    // Make sure the paid amount/currency match what we asked for
    const amountMatches = Math.abs(Number(payhereAmount) - payment.amount.toNumber()) < 0.01;
    if (!amountMatches || payhereCurrency !== payment.currency) {
      console.error("PayHere amount/currency mismatch for order", orderId);
      return new Response("Amount mismatch", { status: 400 });
    }

    const messageType = get("message_type");
    const subscriptionId = get("subscription_id");
    const nextDate = get("item_rec_date_next");
    const payherePaymentId = get("payment_id");

    const defaultRenewal = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const parsedNext = nextDate ? new Date(nextDate) : null;
    const renewsAt = parsedNext && !isNaN(parsedNext.getTime()) ? parsedNext : defaultRenewal;

    if (messageType === "RECURRING_STOPPED" || messageType === "RECURRING_COMPLETE") {
      // Subscription ended -> back to free
      await prisma.user.update({
        where: { id: payment.userId },
        data: { plan: "FREE", planStatus: "CANCELLED", planRenewsAt: null },
      });
    } else if (statusCode === "2") {
      // Success (first payment or a recurring instalment)
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "SUCCESS", payherePaymentId: payherePaymentId || undefined },
        }),
        prisma.user.update({
          where: { id: payment.userId },
          data: {
            plan: "PRO",
            planStatus: "ACTIVE",
            planRenewsAt: renewsAt,
            payhereSubscriptionId: subscriptionId || undefined,
          },
        }),
      ]);
    } else if (statusCode === "-3") {
      // Chargeback
      await prisma.$transaction([
        prisma.payment.update({ where: { id: payment.id }, data: { status: "CHARGEDBACK" } }),
        prisma.user.update({
          where: { id: payment.userId },
          data: { plan: "FREE", planStatus: "CHARGEDBACK", planRenewsAt: null },
        }),
      ]);
    } else if (statusCode === "-1" || statusCode === "-2") {
      // Cancelled / failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: statusCode === "-1" ? "CANCELLED" : "FAILED" },
      });
      if (messageType === "RECURRING_INSTALMENT_FAILED") {
        await prisma.user.update({
          where: { id: payment.userId },
          data: { planStatus: "PAST_DUE" },
        });
      }
    }
    // status_code "0" (pending) needs no action

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("PayHere notify error:", error);
    return new Response("Server error", { status: 500 });
  }
}