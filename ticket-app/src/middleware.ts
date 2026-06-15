import { type NextRequest, NextResponse } from "next/server";
import {
  basicAuthUnauthorized,
  isAuthConfigured,
  isAuthorized,
} from "@/lib/basic-auth";

export function middleware(request: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.next();
  }

  if (!isAuthorized(request.headers.get("authorization"))) {
    return basicAuthUnauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/sales",
    "/register-sale",
    "/check-word",
    "/api/sales",
    "/api/sales/:path*",
    "/api/qr/lookup",
  ],
};
