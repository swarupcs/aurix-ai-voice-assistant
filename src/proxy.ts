import NextAuth from "next-auth"
import authConfig from "@/lib/auth.config"

/**
 * Middleware uses the Edge-safe auth config (no Prisma/DB).
 * JWT verification and route protection only.
 */
export default NextAuth(authConfig).auth

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}