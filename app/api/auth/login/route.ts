import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";

const COOKIE_NAME = "abr-agro-session";

function env(nome: string) {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Variável ausente: ${nome}`);
  return valor;
}

function assinar(payload: string, segredo: string) {
  return createHmac("sha256", segredo).update(payload).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      usuario?: string;
      senha?: string;
    };

    const usuario = String(body.usuario ?? "").trim();
    const senha = String(body.senha ?? "");

    const loginUsuario = env("ABR_LOGIN_USER").trim();
    const loginSenha = env("ABR_LOGIN_PASSWORD");
    const segredo = env("ABR_SESSION_SECRET");

    if (usuario !== loginUsuario || senha !== loginSenha) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Usuário ou senha inválidos." },
        { status: 401 },
      );
    }

    const payload = `${usuario}|${Date.now()}`;
    const value = `${payload}.${assinar(payload, segredo)}`;

    const response = NextResponse.json({
      sucesso: true,
      usuario: {
        id: "USR-ADMIN-ABR-2026",
        nome: "Administrador",
        papel: "administrador",
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[ABR] login", error);
    return NextResponse.json(
      { sucesso: false, mensagem: "Falha ao iniciar sessão." },
      { status: 500 },
    );
  }
}
