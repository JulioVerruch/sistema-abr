import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "abr-agro-session";

function segredo() {
  const valor = process.env.ABR_SESSION_SECRET;
  if (!valor) throw new Error("ABR_SESSION_SECRET não configurado.");
  return valor;
}

export function verificarSessao(request: NextRequest) {
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) return null;

  const pos = cookie.lastIndexOf(".");
  if (pos <= 0) return null;

  const payload = cookie.slice(0, pos);
  const assinatura = cookie.slice(pos + 1);

  if (!/^[a-f0-9]{64}$/i.test(assinatura)) return null;

  const esperada = createHmac("sha256", segredo())
    .update(payload)
    .digest("hex");

  const a = Buffer.from(assinatura, "utf8");
  const b = Buffer.from(esperada, "utf8");

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  const [usuario, timestamp] = payload.split("|");
  if (!usuario || !timestamp) return null;

  if (usuario !== String(process.env.ABR_LOGIN_USER ?? "").trim()) {
    return null;
  }

  return { usuario, criadoEm: Number(timestamp) };
}
