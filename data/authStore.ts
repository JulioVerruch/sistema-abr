/**
 * Cliente de autenticação do Sistema ABR.
 * A autenticação real acontece no servidor.
 */
export type UsuarioSessao = {
  id: string;
  nome: string;
  papel: "administrador";
};

export type ResultadoLogin = {
  sucesso: boolean;
  usuario?: UsuarioSessao;
  mensagem?: string;
};

export async function fazerLogin(
  usuario: string,
  senha: string,
): Promise<ResultadoLogin> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ usuario, senha }),
  });

  const data = (await response.json().catch(() => ({}))) as ResultadoLogin;

  if (!response.ok || !data.sucesso) {
    return {
      sucesso: false,
      mensagem: data.mensagem ?? "Não foi possível realizar o login.",
    };
  }

  return data;
}

export async function fazerLogout() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  });
}

export async function obterSessao(): Promise<UsuarioSessao | null> {
  const response = await fetch("/api/auth/session", {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    autenticado?: boolean;
    usuario?: UsuarioSessao;
  };

  return data.autenticado ? (data.usuario ?? null) : null;
}
