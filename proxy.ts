// proxy.ts
import { default as authMiddleware } from "next-auth/middleware";

// We explicitly declare the function export for Turbopack
export default function proxy(req: any, event: any) {
  return authMiddleware(req, event);
}

// We still tell Next.js which routes to protect
export const config = {
  matcher: [
    "/chat/:path*", 
    "/dashboard/:path*",
    "/admin/:path*"
  ]
};