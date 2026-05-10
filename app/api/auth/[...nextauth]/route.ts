import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  
  // --- ADDED THIS BLOCK ---
  // This tells NextAuth to use your custom page instead of the default UI
  pages: {
    signIn: '/login', 
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };