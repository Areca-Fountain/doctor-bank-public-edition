import { createHash, timingSafeEqual } from "crypto";

const md5Upper = (value: string) =>
  createHash("md5").update(value).digest("hex").toUpperCase();

export const PAYHERE_MODE = process.env.PAYHERE_MODE === "live" ? "live" : "sandbox";

export const PAYHERE_CHECKOUT_URL =
  PAYHERE_MODE === "live"
    ? "https://www.payhere.lk/pay/checkout"
    : "https://sandbox.payhere.lk/pay/checkout";

// Change the price in .env.local (PAYHERE_PLAN_AMOUNT / PAYHERE_PLAN_CURRENCY)
export const PLAN = {
  name: "Doctor Bank Full House (monthly)",
  amount: Number(process.env.PAYHERE_PLAN_AMOUNT ?? "3000"),
  currency: process.env.PAYHERE_PLAN_CURRENCY ?? "LKR",
  recurrence: "1 Month",
  duration: "Forever",
};

export function getPayHereCredentials() {
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  if (!merchantId || !merchantSecret) {
    throw new Error("PAYHERE_MERCHANT_ID / PAYHERE_MERCHANT_SECRET are not set");
  }
  return { merchantId, merchantSecret };
}

// PayHere requires the amount with 2 decimals and no thousands separator
export const formatAmount = (amount: number) => amount.toFixed(2);

// hash = MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret)) in UPPERCASE
export function signCheckout(orderId: string, amount: number, currency: string) {
  const { merchantId, merchantSecret } = getPayHereCredentials();
  return md5Upper(
    merchantId + orderId + formatAmount(amount) + currency + md5Upper(merchantSecret)
  );
}

// md5sig = MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(merchant_secret)) in UPPERCASE
export function verifyNotification(p: {
  merchant_id: string;
  order_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
}) {
  const { merchantId, merchantSecret } = getPayHereCredentials();
  if (p.merchant_id !== merchantId) return false;

  const expected = md5Upper(
    p.merchant_id +
      p.order_id +
      p.payhere_amount +
      p.payhere_currency +
      p.status_code +
      md5Upper(merchantSecret)
  );

  const a = Buffer.from(expected);
  const b = Buffer.from((p.md5sig || "").toUpperCase());
  return a.length === b.length && timingSafeEqual(a, b);
}