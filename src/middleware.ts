import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // api/proxy로 시작하는 모든 요청에 대해 ngrok 헤더 강제 주입
    if (request.nextUrl.pathname.startsWith("/api/proxy")) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("ngrok-skip-browser-warning", "true");

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }
}

export const config = {
    matcher: "/api/proxy/:path*",
};
