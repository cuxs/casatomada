import { NextResponse } from "next/server";

export function isAuthConfigured(): boolean {
  return Boolean(process.env.USER && process.env.PASSWORD);
}

function parseBasicAuth(
  authHeader: string | null,
): { username: string; password: string } | null {
  if (!authHeader?.startsWith("Basic ")) return null;

  try {
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "utf-8",
    );
    const colonIndex = credentials.indexOf(":");
    if (colonIndex === -1) return null;
    return {
      username: credentials.slice(0, colonIndex),
      password: credentials.slice(colonIndex + 1),
    };
  } catch {
    return null;
  }
}

export function isAuthorized(authHeader: string | null): boolean {
  const expectedUser = process.env.USER;
  const expectedPassword = process.env.PASSWORD;

  if (!expectedUser || !expectedPassword) return true;

  const parsed = parseBasicAuth(authHeader);
  if (!parsed) return false;

  return (
    parsed.username === expectedUser && parsed.password === expectedPassword
  );
}

export function basicAuthUnauthorized(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Casa Tomada"',
    },
  });
}

function apiAuthUnauthorized(
  reason: "missing" | "invalid" | "wrong",
): NextResponse {
  const messages = {
    missing: "No autorizado",
    invalid: "Credenciales inválidas",
    wrong: "Credenciales incorrectas",
  };
  return NextResponse.json({ error: messages[reason] }, { status: 401 });
}

export function checkApiAuth(request: {
  headers: { get(name: string): string | null };
}): NextResponse | null {
  if (!isAuthConfigured()) return null;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return apiAuthUnauthorized("missing");
  }

  if (!isAuthorized(authHeader)) {
    const parsed = parseBasicAuth(authHeader);
    return apiAuthUnauthorized(parsed ? "wrong" : "invalid");
  }

  return null;
}
