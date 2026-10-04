import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { OAuth2Client } from "google-auth-library";
import prisma from "@/lib/db";

// Sign-in uses Google Identity Services (the official "Sign in with Google" button).
// The browser never sees a Google password. Google hands our page a signed ID token,
// and this server verifies that token with Google's public keys before creating a session.
const googleClientId =
  process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const googleClient = new OAuth2Client(googleClientId);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "google-identity",
      name: "Google",
      // "credential" is the signed ID token from Google, not something a person types.
      credentials: { credential: { type: "text" } },
      async authorize(credentials) {
        const idToken = credentials?.credential;
        if (!idToken || !googleClientId) return null;

        try {
          const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: googleClientId, // token must have been issued for THIS app
          });
          const p = ticket.getPayload();
          if (!p?.sub || !p.email || !p.email_verified) return null;

          const email = p.email.toLowerCase();
          let user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            user = await prisma.user.create({
              data: { email, name: p.name ?? null, image: p.picture ?? null },
            });
          }
          if (user.suspended) return null;

          return { id: user.id, email, name: user.name ?? p.name ?? null, image: user.image ?? p.picture ?? null };
        } catch (error) {
          console.error("Google sign-in verification failed:", error);
          return null;
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  // Always use our own page so nobody lands on NextAuth's generic credential form.
  pages: { signIn: "/login", error: "/login" },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };