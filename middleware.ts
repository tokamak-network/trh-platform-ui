import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/admin",
  "/settings",
  "/rollup",
  "/explore",
  "/analytics",
  "/users",
  "/configuration",
  "/notification",
  "/support",
];

// Define public routes that don't require authentication
const publicRoutes = ["/auth", "/design-system"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proxy API requests to backend at runtime
  // API_SERVER_URL: server-only, set in Dockerfile for Docker (http://backend:8000)
  // NEXT_PUBLIC_API_BASE_URL: fallback for local dev (http://localhost:8000)
  if (pathname.startsWith("/api/proxy")) {
    let apiBaseUrl =
      process.env.API_SERVER_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:8000";
    apiBaseUrl = apiBaseUrl.replace(/\/+$/, "");
    if (!apiBaseUrl.startsWith("http://") && !apiBaseUrl.startsWith("https://"))
      apiBaseUrl = `https://${apiBaseUrl}`;

    const proxyPath = pathname.replace("/api/proxy", "/api/v1");
    const destination = new URL(
      `${proxyPath}${request.nextUrl.search}`,
      apiBaseUrl
    );

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("ngrok-skip-browser-warning", "true");

    return NextResponse.rewrite(destination, {
      request: { headers: requestHeaders },
    });
  }

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is a public route (like auth)
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the path is for static assets or API routes (excluding proxy)
  const isStaticOrApiRoute =
    (pathname.startsWith("/api") && !pathname.startsWith("/api/proxy")) ||
    pathname.startsWith("/_next") ||
    pathname.includes("favicon.ico");

  // Get the token from cookies
  const token = request.cookies.get("auth-token")?.value;

  // Skip middleware for static assets and API routes
  if (isStaticOrApiRoute) {
    return NextResponse.next();
  }

  // If accessing a protected route without a token, redirect to auth
  if (isProtectedRoute && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If accessing auth page with a token, redirect to dashboard
  if (isPublicRoute && token && pathname === "/auth") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // If accessing root page with a token, redirect to dashboard
  if (pathname === "/" && token) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // For any other route that's not explicitly public and has no token, redirect to auth
  if (!isPublicRoute && !token && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * NOTE: We removed 'api' from exclusion to handle /api/proxy in middleware
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
