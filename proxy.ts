import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";

const COOKIE_NAME = "abr-agro-session";

const PUBLIC = ["/login", "/favicon.ico"];
const PROTECTED = [
  "/",
  "/dashboard",
  "/vendas",
  "/compras",
  "/produtos",
  "/estoque",
  "/clientes",
  "/fornecedores",
  "/financeiro",
  "/relatorios",
  "/analises",
  "/configuracoes",
];

function publicRoute(pathname: string) {
  return PUBLIC.some((route) => pathname === route);
}

function protectedRoute(pathname: string) {
  if (pathname === "/") return true;

  return PROTECTED.some(
    (route) =>
      route !== "/" && (pathname === route || pathname.startsWith(`${route}/`)),
  );
}

function validSession(request: NextRequest) {
  const value = request.cookies.get(COOKIE_NAME)?.value;

  if (!value) return false;

  const index = value.lastIndexOf(".");
  if (index <= 0) return false;

  const payload = value.slice(0, index);
  const signature = value.slice(index + 1);

  const secret = process.env.ABR_SESSION_SECRET;
  const expectedUser = String(process.env.ABR_LOGIN_USER ?? "").trim();

  if (!secret || !expectedUser) return false;
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;

  const expected = createHmac("sha256", secret).update(payload).digest("hex");

  return signature === expected && payload.startsWith(`${expectedUser}|`);
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const authenticated = validSession(request);

  if (pathname === "/login") {
    if (authenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (!protectedRoute(pathname)) {
    return NextResponse.next();
  }

  if (authenticated) {
    return NextResponse.next();
  }

  const url = new URL("/login", request.url);
  url.searchParams.set("redirect", pathname);

  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
