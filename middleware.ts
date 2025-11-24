import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/present(.*)', // Presentation mode - allow clients to view proposals without login
  '/api/proposals/(.*)/view-inline', // API endpoint for serving proposal HTML in presentation mode
]);

export default clerkMiddleware(async (auth, req) => {
  // If it's not a public route, require authentication
  if (!isPublicRoute(req)) {
    await auth();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
