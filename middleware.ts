import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Public routes that do NOT require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  
  // Redirect authenticated users from root to /app
  if (userId && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/app', req.url))
  }
  
  if (!isPublicRoute(req)) {
    auth().protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|pdf)).*)',
    '/(api|trpc)(.*)',
  ],
}
