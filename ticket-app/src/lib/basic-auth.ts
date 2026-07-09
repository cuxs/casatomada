import { NextResponse } from "next/server";

export type AuthScope = "admin" | "guardarropa";

type Credentials = { username: string; password: string };

function adminCredentials(): Credentials | null {
  if (!process.env.USER || !process.env.PASSWORD) return null;
  return { username: process.env.USER, password: process.env.PASSWORD };
}

function guardarropaCredentials(): Credentials | null {
  if (!process.env.GUARDARROPA_USER || !process.env.GUARDARROPA_PASSWORD) {
    return null;
  }
  return {
    username: process.env.GUARDARROPA_USER,
    password: process.env.GUARDARROPA_PASSWORD,
  };
}

// Admin credentials also unlock guardarropa, but not the other way around.
function acceptedCredentials(scope: AuthScope): Credentials[] {
  const pairs =
    scope === "guardarropa"
      ? [adminCredentials(), guardarropaCredentials()]
      : [adminCredentials()];
  return pairs.filter((pair): pair is Credentials => pair !== null);
}

export function isAuthConfigured(scope: AuthScope = "admin"): boolean {
  return acceptedCredentials(scope).length > 0;
}

function parseBasicAuth(authHeader: string | null): Credentials | null {
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

export function isAuthorized(
  authHeader: string | null,
  scope: AuthScope = "admin",
): boolean {
  const accepted = acceptedCredentials(scope);
  if (accepted.length === 0) return true;

  const parsed = parseBasicAuth(authHeader);
  if (!parsed) return false;

  return accepted.some(
    (pair) =>
      parsed.username === pair.username && parsed.password === pair.password,
  );
}

export function basicAuthUnauthorized(realm = "Casa Tomada"): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${realm}"`,
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

export function checkApiAuth(
  request: {
    headers: { get(name: string): string | null };
  },
  scope: AuthScope = "admin",
): NextResponse | null {
  if (!isAuthConfigured(scope)) return null;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return apiAuthUnauthorized("missing");
  }

  if (!isAuthorized(authHeader, scope)) {
    const parsed = parseBasicAuth(authHeader);
    return apiAuthUnauthorized(parsed ? "wrong" : "invalid");
  }

  return null;
}
