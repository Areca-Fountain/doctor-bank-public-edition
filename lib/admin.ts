import { getServerSession } from "next-auth/next";
import prisma from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Emails listed in ADMIN_EMAILS (comma separated) are always admins, even if the database says otherwise.
// This is how the first admin is created and it means you can never lock yourself out.
const envAdminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const isEnvAdmin = (email?: string | null) =>
  !!email && envAdminEmails().includes(email.toLowerCase());

export const isAdminUser = (user: { email: string | null; role: string }) =>
  user.role === "ADMIN" || isEnvAdmin(user.email);

// Returns the logged-in admin user, or null if nobody is logged in or they are not an admin.
// Every admin API route and the admin page must call this on the server.
export async function getAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.suspended || !isAdminUser(user)) return null;
  return user;
}

export async function logAdminAction(entry: {
  adminEmail: string;
  action: string;
  targetUserId?: string | null;
  targetEmail?: string | null;
  details?: Record<string, string | number | boolean | null>;
}) {
  try {
    await prisma.adminLog.create({
      data: {
        adminEmail: entry.adminEmail,
        action: entry.action,
        targetUserId: entry.targetUserId ?? null,
        targetEmail: entry.targetEmail ?? null,
        details: entry.details ?? undefined,
      },
    });
  } catch (error) {
    console.error("Failed to write admin log:", error);
  }
}