// proxy.ts
import { withAuth } from "next-auth/middleware";

// Signed-out visitors go to our own /login page (with the official Google button).
const authMiddleware = withAuth({ pages: { signIn: "/login" } });

// We explicitly declare the function export for Turbopack
export default function proxy(req: any, event: any) {
  return (authMiddleware as any)(req, event);
}

// We still tell Next.js which routes to protect
export const config = {
  matcher: [
    "/chat/:path*",
    "/dashboard/:path*",
    "/admin/:path*"
  ]
};