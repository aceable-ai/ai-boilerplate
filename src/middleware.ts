import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)'])

export default clerkMiddleware(async (auth, request) => {
  console.log(`[MIDDLEWARE] ${request.method} ${request.nextUrl.pathname} - isPublic: ${isPublicRoute(request)}`);
  
  // Bypass authentication for Playwright testing (development only)
  if (process.env.NODE_ENV === 'development' && process.env.PLAYWRIGHT_TESTING === 'true') {
    console.log(`[MIDDLEWARE] Bypassing auth for Playwright testing: ${request.nextUrl.pathname}`);
    return;
  }
  
  if (!isPublicRoute(request)) {
    console.log(`[MIDDLEWARE] Protecting route: ${request.nextUrl.pathname}`);
    await auth.protect();
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}