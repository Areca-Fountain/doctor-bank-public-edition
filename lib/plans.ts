// Plan rules in one place so the API and the UI use the same numbers.

export const FREE_CHAT_LIMIT = 1; // lifetime number of chats a Free user can start
export const FREE_MESSAGE_LIMIT = 10; // messages a Free user can send inside that chat

// Safety margin if a renewal webhook arrives late
const GRACE_MS = 7 * 24 * 60 * 60 * 1000;

export function isProUser(user: {
  plan: string;
  planStatus: string;
  planRenewsAt: Date | null;
}) {
  if (user.plan !== "PRO" || user.planStatus !== "ACTIVE") return false;
  if (!user.planRenewsAt) return true;
  return user.planRenewsAt.getTime() + GRACE_MS > Date.now();
}