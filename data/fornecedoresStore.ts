"use client";

export type StatusFornecedor = "ativo" | "inativo";

export type Fornecedor = {
  id: string;

  codigo: string;

  razaoSocial: string;

  nomeFantasia?: string;

  documento?: string;

  email?: string;

  telefone?: string;

  celular?: string;

  cep?: string;

  endereco?: string;

  numero?: string;

  complemento?: string;

  bairro?: string;

  cidade?: string;

  estado?: string;

  observacao?: string;

  status: StatusFornecedor;

  criadoEm: string;

  atualizadoEm: string;
};

const CHAVE_FORNECEDORES = "sistema-abr-fornecedores";

function temJanela() {
  return typeof window !== "undefined";
}

function gerarId() {
  return `fornecedor-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
}

function gerarCodigo(fornecedores: Fornecedor[]) {
  let maiorNumero = 0;

  fornecedores.forEach((fornecedor) => {
    const numero = Number(fornecedor.codigo.replace(/\D/g, ""));

    if (Number.isFinite(numero) && numero > maiorNumero) {
      maiorNumero = numero;
    }
  });

  return String(maiorNumero + 1).padStart(5, "0");
}

/* =========================================================
   DOCUMENTOS — CPF / CNPJ
   ========================================================= */

export function normalizarDocumento(documento?: string): string {
  return (documento ?? "").replace(/\D/g, "");
}

export function validarCPF(documento?: string): boolean {
  const cpf = normalizarDocumento(documento);

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let soma = 0;

  for (let i = 0; i < 9; i++) {
    soma += Number(cpf.charAt(i)) * (10 - i);
  }

  let resto = soma % 11;
  const primeiroDigito = resto < 2 ? 0 : 11 - resto;

  if (Number(cpf.charAt(9)) !== primeiroDigito) {
    return false;
  }

  soma = 0;

  for (let i = 0; i < 10; i++) {
    soma += Number(cpf.charAt(i)) * (11 - i);
  }

  resto = soma % 11;
  const segundoDigito = resto < 2 ? 0 : 11 - resto;

  return Number(cpf.charAt(10)) === segundoDigito;
}

export function validarCNPJ(documento?: string): boolean {
  const cnpj = normalizarDocumento(documento);

  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  const calcularDigito = (tamanho: number) => {
    let soma = 0;
    let posicao = tamanho - 7;

    for (let i = 0; i < tamanho; i++) {
      soma += Number(cnpj.charAt(i)) * posicao;
      posicao--;
      if (posicao < 2) posicao = 9;
    }

    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiroDigito = calcularDigito(12);
  if (Number(cnpj.charAt(12)) !== primeiroDigito) return false;

  const segundoDigito = calcularDigito(13);
  return Number(cnpj.charAt(13)) === segundoDigito;
}

export function formatarCPF(documento?: string): string {
  const cpf = normalizarDocumento(documento).slice(0, 11);
  if (cpf.length <= 3) return cpf;
  if (cpf.length <= 6) return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
  if (cpf.length <= 9)
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

export function formatarCNPJ(documento?: string): string {
  const cnpj = normalizarDocumento(documento).slice(0, 14);
  if (cnpj.length <= 2) return cnpj;
  if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
  if (cnpj.length <= 8)
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
  if (cnpj.length <= 12)
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

export function formatarDocumento(documento?: string): string {
  const numeros = normalizarDocumento(documento);
  return numeros.length > 11 ? formatarCNPJ(numeros) : formatarCPF(numeros);
}

export function validarDocumentoFornecedor(documento?: string): string | null {
  if (!documento?.trim()) return null;

  const numeros = normalizarDocumento(documento);

  if (numeros.length === 11) {
    return validarCPF(numeros)
      ? null
      : "CPF inválido. Informe um CPF válido com 11 dígitos.";
  }

  if (numeros.length === 14) {
    return validarCNPJ(numeros)
      ? null
      : "CNPJ inválido. Informe um CNPJ válido com 14 dígitos.";
  }

  return "Informe um CPF com 11 dígitos ou um CNPJ com 14 dígitos.";
}

export function fornecedorDocumentoJaCadastrado(
  documento: string,
  ignorarId?: string,
): boolean {
  const normalizado = normalizarDocumento(documento);
  if (!normalizado) return false;

  return obterFornecedores().some((fornecedor) => {
    if (ignorarId && fornecedor.id === ignorarId) return false;
    return normalizarDocumento(fornecedor.documento) === normalizado;
  });
}

export function validarDadosFornecedor(
  dados: Partial<Fornecedor>,
): string | null {
  if (!dados.razaoSocial?.trim()) {
    return "Informe a razão social do fornecedor.";
  }

  const erroDocumento = validarDocumentoFornecedor(dados.documento);
  if (erroDocumento) return erroDocumento;

  if (
    dados.email?.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email.trim())
  ) {
    return "Informe um e-mail válido.";
  }

  return null;
}

function salvarFornecedores(fornecedores: Fornecedor[]) {
  if (!temJanela()) {
    return;
  }

  localStorage.setItem(CHAVE_FORNECEDORES, JSON.stringify(fornecedores));

  window.dispatchEvent(
    new CustomEvent("abr-agro-fornecedores-atualizados", {
      detail: fornecedores,
    }),
  );
}

export function obterFornecedores(): Fornecedor[] {
  if (!temJanela()) {
    return [];
  }

  try {
    const dados = localStorage.getItem(CHAVE_FORNECEDORES);

    if (!dados) {
      return [];
    }

    const fornecedores = JSON.parse(dados);

    if (!Array.isArray(fornecedores)) {
      return [];
    }

    return fornecedores;
  } catch {
    return [];
  }
}

export function obterFornecedorPorId(id: string): Fornecedor | undefined {
  return obterFornecedores().find((fornecedor) => fornecedor.id === id);
}

export function obterFornecedorPorCodigo(
  codigo: string,
): Fornecedor | undefined {
  return obterFornecedores().find((fornecedor) => fornecedor.codigo === codigo);
}

export function buscarFornecedores(termo: string): Fornecedor[] {
  const busca = termo.trim().toLowerCase();

  if (!busca) {
    return obterFornecedores();
  }

  return obterFornecedores().filter(
    (fornecedor) =>
      fornecedor.razaoSocial.toLowerCase().includes(busca) ||
      fornecedor.nomeFantasia?.toLowerCase().includes(busca) ||
      fornecedor.codigo.toLowerCase().includes(busca) ||
      fornecedor.documento?.toLowerCase().includes(busca) ||
      fornecedor.email?.toLowerCase().includes(busca) ||
      fornecedor.telefone?.toLowerCase().includes(busca) ||
      fornecedor.cidade?.toLowerCase().includes(busca) ||
      fornecedor.estado?.toLowerCase().includes(busca),
  );
}

export function criarFornecedor(
  dados: Omit<
    Fornecedor,
    "id" | "codigo" | "status" | "criadoEm" | "atualizadoEm"
  > & {
    status?: StatusFornecedor;
  },
): Fornecedor {
  const erro = validarDadosFornecedor(dados);
  if (erro) throw new Error(erro);

  if (dados.documento && fornecedorDocumentoJaCadastrado(dados.documento)) {
    throw new Error("Já existe um fornecedor cadastrado com este CPF/CNPJ.");
  }

  const fornecedores = obterFornecedores();
  const agora = new Date().toISOString();

  const fornecedor: Fornecedor = {
    ...dados,
    documento: dados.documento
      ? normalizarDocumento(dados.documento)
      : undefined,
    id: gerarId(),
    codigo: gerarCodigo(fornecedores),
    status: dados.status ?? "ativo",
    criadoEm: agora,
    atualizadoEm: agora,
  };

  salvarFornecedores([...fornecedores, fornecedor]);
  return fornecedor;
}

export function atualizarFornecedor(
  id: string,
  dados: Partial<Omit<Fornecedor, "id" | "codigo" | "criadoEm">>,
): Fornecedor | null {
  const fornecedores = obterFornecedores();

  const indice = fornecedores.findIndex((fornecedor) => fornecedor.id === id);

  if (indice === -1) {
    return null;
  }

  const fornecedorAtual = fornecedores[indice];

  const fornecedorAtualizado: Fornecedor = {
    ...fornecedorAtual,
    ...dados,
    documento:
      dados.documento === undefined
        ? fornecedorAtual.documento
        : dados.documento
          ? normalizarDocumento(dados.documento)
          : undefined,
    atualizadoEm: new Date().toISOString(),
  };

  const erro = validarDadosFornecedor(fornecedorAtualizado);
  if (erro) throw new Error(erro);

  if (
    fornecedorAtualizado.documento &&
    fornecedorDocumentoJaCadastrado(fornecedorAtualizado.documento, id)
  ) {
    throw new Error("Já existe outro fornecedor cadastrado com este CPF/CNPJ.");
  }

  fornecedores[indice] = fornecedorAtualizado;
  salvarFornecedores(fornecedores);
  return fornecedorAtualizado;
}

export function alterarStatusFornecedor(
  id: string,
  status: StatusFornecedor,
): Fornecedor | null {
  return atualizarFornecedor(id, {
    status,
  });
}

export function ativarFornecedor(id: string): Fornecedor | null {
  return alterarStatusFornecedor(id, "ativo");
}

export function inativarFornecedor(id: string): Fornecedor | null {
  return alterarStatusFornecedor(id, "inativo");
}

export function excluirFornecedor(id: string): boolean {
  const fornecedores = obterFornecedores();

  const existe = fornecedores.some((fornecedor) => fornecedor.id === id);

  if (!existe) {
    return false;
  }

  const restantes = fornecedores.filter((fornecedor) => fornecedor.id !== id);

  salvarFornecedores(restantes);

  return true;
}

export function obterResumoFornecedores() {
  const fornecedores = obterFornecedores();

  const ativos = fornecedores.filter(
    (fornecedor) => fornecedor.status === "ativo",
  ).length;

  const inativos = fornecedores.filter(
    (fornecedor) => fornecedor.status === "inativo",
  ).length;

  return {
    total: fornecedores.length,

    ativos,

    inativos,
  };
}

export function obterStatusFornecedorLabel(status: StatusFornecedor) {
  const labels: Record<StatusFornecedor, string> = {
    ativo: "Ativo",
    inativo: "Inativo",
  };

  return labels[status];
}
