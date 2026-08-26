import { NextRequest, NextResponse } from "next/server";
import { verificarSessao } from "@/lib/abr-session";

export async function GET(request: NextRequest) {
  const sessao = verificarSessao(request);

  if (!sessao) {
    return NextResponse.json({ autenticado: false });
  }

  return NextResponse.json({
    autenticado: true,
    usuario: {
      id: "USR-ADMIN-ABR-2026",
      nome: "Administrador",
      papel: "administrador",
    },
  });
}
