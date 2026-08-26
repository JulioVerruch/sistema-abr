/**
 * Usuários e permissões — Sistema ABR
 *
 * Base local para desenvolvimento.
 *
 * Observação:
 * As credenciais são armazenadas como SHA-256 no localStorage.
 * Isso NÃO substitui autenticação de servidor para produção.
 */

export type PapelUsuario =
  | "administrador"
  | "gerente"
  | "financeiro"
  | "vendas"
  | "estoque";

export type ModuloSistema =
  | "dashboard"
  | "vendas"
  | "produtos"
  | "estoque"
  | "clientes"
  | "fornecedores"
  | "compras"
  | "financeiro"
  | "relatorios"
  | "analises"
  | "configuracoes";

export type AcaoPermissao =
  | "visualizar"
  | "criar"
  | "editar"
  | "excluir"
  | "cancelar"
  | "estornar"
  | "aprovar";

export type Permissoes = Partial<Record<ModuloSistema, AcaoPermissao[]>>;

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  ativo: boolean;
  permissoes: Permissoes;
  passwordHash: string;
  criadoEm: string;
  atualizadoEm: string;
  ultimoLoginEm?: string;
};

export type NovoUsuario = {
  nome: string;
  email: string;
  senha: string;
  papel: PapelUsuario;
  ativo?: boolean;
  permissoes?: Permissoes;
};

const STORAGE_KEY = "abr-agro-usuarios";
const EVENTO_ATUALIZADO = "abr-agro-usuarios-atualizados";

const TODAS_ACOES: AcaoPermissao[] = [
  "visualizar",
  "criar",
  "editar",
  "excluir",
  "cancelar",
  "estornar",
  "aprovar",
];

const TODOS_MODULOS: ModuloSistema[] = [
  "dashboard",
  "vendas",
  "produtos",
  "estoque",
  "clientes",
  "fornecedores",
  "compras",
  "financeiro",
  "relatorios",
  "analises",
  "configuracoes",
];

/**
 * SHA-256.
 *
 * Fica assíncrono para utilizar a Web Crypto API do navegador.
 */
export async function hashSenha(senha: string): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("A autenticação local deve ser executada no navegador.");
  }

  const dados = new TextEncoder().encode(senha);

  const hash = await window.crypto.subtle.digest("SHA-256", dados);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

function gerarId(prefixo = "USR"): string {
  return `${prefixo}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)
    .toUpperCase()}`;
}

function agora(): string {
  return new Date().toISOString();
}

function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T;
}

function criarPermissoesVazias(): Permissoes {
  return {};
}

export function criarPermissoesCompletas(): Permissoes {
  return TODOS_MODULOS.reduce<Permissoes>((resultado, modulo) => {
    resultado[modulo] = [...TODAS_ACOES];
    return resultado;
  }, {});
}

export function obterPermissoesPadrao(papel: PapelUsuario): Permissoes {
  switch (papel) {
    case "administrador":
      return criarPermissoesCompletas();

    case "gerente":
      return {
        dashboard: ["visualizar"],
        vendas: [
          "visualizar",
          "criar",
          "editar",
          "cancelar",
          "estornar",
          "aprovar",
        ],
        produtos: ["visualizar", "criar", "editar"],
        estoque: ["visualizar", "criar", "editar", "estornar"],
        clientes: ["visualizar", "criar", "editar"],
        fornecedores: ["visualizar", "criar", "editar"],
        compras: [
          "visualizar",
          "criar",
          "editar",
          "cancelar",
          "estornar",
          "aprovar",
        ],
        financeiro: [
          "visualizar",
          "criar",
          "editar",
          "cancelar",
          "estornar",
          "aprovar",
        ],
        relatorios: ["visualizar"],
        analises: ["visualizar"],
      };

    case "financeiro":
      return {
        dashboard: ["visualizar"],
        vendas: ["visualizar"],
        produtos: ["visualizar"],
        estoque: ["visualizar"],
        clientes: ["visualizar"],
        fornecedores: ["visualizar"],
        compras: ["visualizar"],
        financeiro: [
          "visualizar",
          "criar",
          "editar",
          "cancelar",
          "estornar",
          "aprovar",
        ],
        relatorios: ["visualizar"],
        analises: ["visualizar"],
      };

    case "vendas":
      return {
        dashboard: ["visualizar"],
        vendas: ["visualizar", "criar", "editar"],
        produtos: ["visualizar"],
        estoque: ["visualizar"],
        clientes: ["visualizar", "criar", "editar"],
        fornecedores: ["visualizar"],
        compras: ["visualizar"],
        relatorios: ["visualizar"],
      };

    case "estoque":
      return {
        dashboard: ["visualizar"],
        vendas: ["visualizar"],
        produtos: ["visualizar", "criar", "editar"],
        estoque: ["visualizar", "criar", "editar", "estornar"],
        clientes: ["visualizar"],
        fornecedores: ["visualizar"],
        compras: [
          "visualizar",
          "criar",
          "editar",
          "receber" as AcaoPermissao,
        ].filter((acao): acao is AcaoPermissao => TODAS_ACOES.includes(acao)),
        relatorios: ["visualizar"],
      };
  }
}

function lerUsuarios(): Usuario[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const bruto = window.localStorage.getItem(STORAGE_KEY);

    if (!bruto) {
      return [];
    }

    const dados = JSON.parse(bruto);

    return Array.isArray(dados) ? (dados as Usuario[]) : [];
  } catch {
    return [];
  }
}

function salvarUsuarios(usuarios: Usuario[]): Usuario[] {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));

  window.dispatchEvent(
    new CustomEvent(EVENTO_ATUALIZADO, {
      detail: usuarios,
    }),
  );

  return usuarios;
}

/**
 * Inicializa o administrador padrão apenas quando
 * ainda não existe nenhum usuário.
 *
 * Login inicial:
 * e-mail: admin@abr.local
 * senha: admin123
 *
 * Troque a senha antes de qualquer uso real.
 */
export function inicializarUsuarios(): Usuario[] {
  const usuarios = lerUsuarios();

  if (usuarios.length > 0) {
    return usuarios;
  }

  const data = agora();

  const administrador: Usuario = {
    id: gerarId(),
    nome: "Administrador",
    email: "admin@abr.local",
    papel: "administrador",
    ativo: true,
    permissoes: obterPermissoesPadrao("administrador"),
    passwordHash:
      "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",
    criadoEm: data,
    atualizadoEm: data,
  };

  return salvarUsuarios([administrador]);
}

export function obterUsuarios(): Usuario[] {
  return clonar(inicializarUsuarios());
}

export function obterUsuarioPorId(id: string): Usuario | null {
  return obterUsuarios().find((usuario) => usuario.id === id) ?? null;
}

export function obterUsuarioPorEmail(email: string): Usuario | null {
  const normalizado = normalizarEmail(email);

  return (
    obterUsuarios().find(
      (usuario) => normalizarEmail(usuario.email) === normalizado,
    ) ?? null
  );
}

export function usuarioEmailJaCadastrado(
  email: string,
  ignorarId?: string,
): boolean {
  const normalizado = normalizarEmail(email);

  return obterUsuarios().some(
    (usuario) =>
      usuario.id !== ignorarId &&
      normalizarEmail(usuario.email) === normalizado,
  );
}

export async function criarUsuario(dados: NovoUsuario): Promise<Usuario> {
  const nome = dados.nome.trim();
  const email = normalizarEmail(dados.email);
  const senha = dados.senha;

  if (!nome) {
    throw new Error("Informe o nome do usuário.");
  }

  if (!email || !email.includes("@")) {
    throw new Error("Informe um e-mail válido.");
  }

  if (senha.length < 6) {
    throw new Error("A senha deve possuir pelo menos 6 caracteres.");
  }

  if (usuarioEmailJaCadastrado(email)) {
    throw new Error("Já existe um usuário com este e-mail.");
  }

  const data = agora();

  const usuario: Usuario = {
    id: gerarId(),
    nome,
    email,
    papel: dados.papel,
    ativo: dados.ativo ?? true,
    permissoes: dados.permissoes ?? obterPermissoesPadrao(dados.papel),
    passwordHash: await hashSenha(senha),
    criadoEm: data,
    atualizadoEm: data,
  };

  salvarUsuarios([...lerUsuarios(), usuario]);

  return clonar(usuario);
}

export function atualizarUsuario(
  id: string,
  alteracoes: Partial<Omit<Usuario, "id" | "criadoEm">>,
): Usuario {
  const usuarios = lerUsuarios();

  const indice = usuarios.findIndex((usuario) => usuario.id === id);

  if (indice === -1) {
    throw new Error("Usuário não encontrado.");
  }

  if (alteracoes.email && usuarioEmailJaCadastrado(alteracoes.email, id)) {
    throw new Error("Já existe outro usuário com este e-mail.");
  }

  const atualizado: Usuario = {
    ...usuarios[indice],
    ...alteracoes,
    email: alteracoes.email
      ? normalizarEmail(alteracoes.email)
      : usuarios[indice].email,
    atualizadoEm: agora(),
  };

  usuarios[indice] = atualizado;

  salvarUsuarios(usuarios);

  return clonar(atualizado);
}

export async function alterarSenhaUsuario(
  id: string,
  novaSenha: string,
): Promise<Usuario> {
  if (novaSenha.length < 6) {
    throw new Error("A senha deve possuir pelo menos 6 caracteres.");
  }

  const passwordHash = await hashSenha(novaSenha);

  return atualizarUsuario(id, {
    passwordHash,
  });
}

export function excluirUsuario(id: string): void {
  const usuarios = lerUsuarios();

  if (usuarios.length <= 1) {
    throw new Error("O sistema precisa manter pelo menos um usuário.");
  }

  const usuario = usuarios.find((item) => item.id === id);

  if (!usuario) {
    throw new Error("Usuário não encontrado.");
  }

  if (usuario.papel === "administrador") {
    const administradores = usuarios.filter(
      (item) => item.papel === "administrador" && item.ativo,
    );

    if (administradores.length <= 1) {
      throw new Error("Não é possível excluir o último administrador ativo.");
    }
  }

  salvarUsuarios(usuarios.filter((item) => item.id !== id));
}

export function pode(
  usuario: Usuario | null,
  modulo: ModuloSistema,
  acao: AcaoPermissao,
): boolean {
  if (!usuario || !usuario.ativo) {
    return false;
  }

  if (usuario.papel === "administrador") {
    return true;
  }

  return Boolean(usuario.permissoes[modulo]?.includes(acao));
}

export function atualizarPermissoesUsuario(
  id: string,
  permissoes: Permissoes,
): Usuario {
  return atualizarUsuario(id, {
    permissoes,
  });
}

export { STORAGE_KEY, EVENTO_ATUALIZADO, TODAS_ACOES, TODOS_MODULOS };
