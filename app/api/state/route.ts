import { NextRequest, NextResponse } from "next/server";
import { verificarSessao } from "@/lib/abr-session";

const TABLE = "abr_app_state";
const ROW_ID = "main";

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configurados.",
    );
  }

  return { url: url.replace(/\/$/, ""), key };
}

function headers(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export async function GET(request: NextRequest) {
  if (!verificarSessao(request)) {
    return NextResponse.json({ mensagem: "Não autenticado." }, { status: 401 });
  }

  try {
    const { url, key } = config();
    const response = await fetch(
      `${url}/rest/v1/${TABLE}?id=eq.${ROW_ID}&select=state,updated_at`,
      { headers: headers(key), cache: "no-store" },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ existe: false, state: {} });
      }

      return NextResponse.json(
        { mensagem: "Falha ao carregar os dados centrais." },
        { status: 502 },
      );
    }

    const rows = (await response.json()) as Array<{
      state: Record<string, string>;
      updated_at: string;
    }>;

    if (!rows[0]) {
      return NextResponse.json({ existe: false, state: {} });
    }

    return NextResponse.json({
      existe: true,
      state: rows[0].state ?? {},
      updatedAt: rows[0].updated_at,
    });
  } catch (error) {
    console.error("[ABR] state GET", error);
    return NextResponse.json(
      { mensagem: "Banco central indisponível." },
      { status: 503 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!verificarSessao(request)) {
    return NextResponse.json({ mensagem: "Não autenticado." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      state?: Record<string, string>;
    };

    if (!body.state || Array.isArray(body.state)) {
      return NextResponse.json(
        { mensagem: "Estado inválido." },
        { status: 400 },
      );
    }

    const { url, key } = config();

    const response = await fetch(`${url}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: {
        ...headers(key),
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        id: ROW_ID,
        state: body.state,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { mensagem: "Falha ao salvar os dados centrais." },
        { status: 502 },
      );
    }

    return NextResponse.json({ sucesso: true });
  } catch (error) {
    console.error("[ABR] state PUT", error);
    return NextResponse.json(
      { mensagem: "Banco central indisponível." },
      { status: 503 },
    );
  }
}
