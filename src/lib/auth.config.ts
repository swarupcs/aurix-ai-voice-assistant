import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

/**
 * Shared auth configuration (Edge-safe — no Node.js dependencies).
 * Used by both the middleware (proxy.ts) and the full auth setup (auth.ts).
 */
export default {
  providers: [Google, GitHub],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    // Called by middleware to determine access
    // TODO: TEMPORARY — auth disabled for testing. Re-enable before production.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === "/login";

      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true; // Allow all routes — testing mode
    },
  },
} satisfies NextAuthConfig;
