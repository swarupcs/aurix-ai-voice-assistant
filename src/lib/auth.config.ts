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
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === "/login";
      const isPublicRoute = nextUrl.pathname === "/"; // Add other public routes here if needed

      if (isOnLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true; // Let unauthenticated users see the login page
      }

      // If they are not logged in and not on a public route (or login), redirect them to login
      if (!isLoggedIn && !isPublicRoute) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      return true; // Let authenticated users or visitors to public routes through
    },
  },
} satisfies NextAuthConfig;
