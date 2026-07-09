import { type NextRequest, NextResponse } from "next/server";
import {
  type AuthScope,
  basicAuthUnauthorized,
  isAuthConfigured,
  isAuthorized,
} from "@/lib/basic-auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isGuardarropa =
    pathname === "/guardarropa" ||
    pathname.startsWith("/guardarropa/") ||
    pathname.startsWith("/api/guardarropa");
  const scope: AuthScope = isGuardarropa ? "guardarropa" : "admin";

  if (!isAuthConfigured(scope)) {
    return NextResponse.next();
  }

  if (!isAuthorized(request.headers.get("authorization"), scope)) {
    return basicAuthUnauthorized(isGuardarropa ? "Guardarropa" : "Casa Tomada");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/sales",
    "/api/sales/:path*",
    "/guardarropa",
    "/guardarropa/:path*",
    "/api/guardarropa/:path*",
  ],
};
