export type StatusCliente = "ativo" | "inativo";

export type TipoCliente = "fisica" | "juridica";

export interface Cliente {
  id: string;
  codigo: string;

  tipo: TipoCliente;

  nome: string;
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

  status: StatusCliente;

  dataCadastro: string;
  dataAtualizacao: string;
}

const STORAGE_KEY = "abr-agro-clientes";

const EVENTO_ATUALIZADO = "abr-agro-clientes-atualizados";

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function gerarId() {
  return `cliente-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function gerarCodigo(clientes: Cliente[]) {
  let maiorNumero = 0;

  for (const cliente of clientes) {
    const numero = Number(cliente.codigo.replace(/\D/g, ""));

    if (Number.isFinite(numero) && numero > maiorNumero) {
      maiorNumero = numero;
    }
  }

  return String(maiorNumero + 1).padStart(5, "0");
}

function obterAgora() {
  return new Date().toISOString();
}

/* =========================================================
   NORMALIZAÇÃO DE DOCUMENTOS
   ========================================================= */

export function normalizarDocumento(documento?: string): string {
  return (documento ?? "").replace(/\D/g, "");
}

/* =========================================================
   VALIDAÇÃO DE CPF
   ========================================================= */

export function validarCPF(documento?: string): boolean {
  const cpf = normalizarDocumento(documento);

  if (cpf.length !== 11) {
    return false;
  }

  // Rejeita sequências como:
  // 00000000000
  // 11111111111
  // 22222222222
  // etc.
  if (/^(\d)\1{10}$/.test(cpf)) {
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

/* =========================================================
   VALIDAÇÃO DE CNPJ
   ========================================================= */

export function validarCNPJ(documento?: string): boolean {
  const cnpj = normalizarDocumento(documento);

  if (cnpj.length !== 14) {
    return false;
  }

  // Rejeita sequências repetidas
  // 00000000000000
  // 11111111111111
  // etc.
  if (/^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  const calcularDigito = (tamanho: number) => {
    let soma = 0;
    let posicao = tamanho - 7;

    for (let i = 0; i < tamanho; i++) {
      soma += Number(cnpj.charAt(i)) * posicao;

      posicao--;

      if (posicao < 2) {
        posicao = 9;
      }
    }

    const resto = soma % 11;

    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiroDigito = calcularDigito(12);

  if (Number(cnpj.charAt(12)) !== primeiroDigito) {
    return false;
  }

  const segundoDigito = calcularDigito(13);

  return Number(cnpj.charAt(13)) === segundoDigito;
}

/* =========================================================
   FORMATAÇÃO DE CPF / CNPJ
   ========================================================= */

export function formatarCPF(documento?: string): string {
  const cpf = normalizarDocumento(documento).slice(0, 11);

  if (cpf.length <= 3) {
    return cpf;
  }

  if (cpf.length <= 6) {
    return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
  }

  if (cpf.length <= 9) {
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
  }

  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(
    6,
    9,
  )}-${cpf.slice(9)}`;
}

export function formatarCNPJ(documento?: string): string {
  const cnpj = normalizarDocumento(documento).slice(0, 14);

  if (cnpj.length <= 2) {
    return cnpj;
  }

  if (cnpj.length <= 5) {
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
  }

  if (cnpj.length <= 8) {
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
  }

  if (cnpj.length <= 12) {
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(
      5,
      8,
    )}/${cnpj.slice(8)}`;
  }

  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(
    5,
    8,
  )}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

export function formatarDocumento(
  documento: string | undefined,
  tipo: TipoCliente,
): string {
  if (tipo === "fisica") {
    return formatarCPF(documento);
  }

  return formatarCNPJ(documento);
}

/* =========================================================
   PERSISTÊNCIA
   ========================================================= */

function lerClientes(): Cliente[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const dados = window.localStorage.getItem(STORAGE_KEY);

    if (!dados) {
      return [];
    }

    const clientes = JSON.parse(dados);

    if (!Array.isArray(clientes)) {
      return [];
    }

    return clientes;
  } catch (error) {
    console.error("Erro ao carregar clientes:", error);

    return [];
  }
}

function salvarClientes(clientes: Cliente[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));

    window.dispatchEvent(new CustomEvent(EVENTO_ATUALIZADO));
  } catch (error) {
    console.error("Erro ao salvar clientes:", error);
  }
}

/* =========================================================
   LISTAGEM
   ========================================================= */

export function obterClientes(): Cliente[] {
  return lerClientes();
}

/* =========================================================
   BUSCAR POR ID
   ========================================================= */

export function obterClientePorId(id: string): Cliente | null {
  const clientes = lerClientes();

  return clientes.find((cliente) => cliente.id === id) ?? null;
}

/* =========================================================
   BUSCAR POR CÓDIGO
   ========================================================= */

export function obterClientePorCodigo(codigo: string): Cliente | null {
  const clientes = lerClientes();

  return clientes.find((cliente) => cliente.codigo === codigo) ?? null;
}

/* =========================================================
   CRIAR CLIENTE
   ========================================================= */

export type DadosNovoCliente = Omit<
  Cliente,
  "id" | "codigo" | "dataCadastro" | "dataAtualizacao"
>;

export function criarCliente(dados: DadosNovoCliente): Cliente {
  const erro = validarDadosCliente(dados);

  if (erro) {
    throw new Error(erro);
  }

  if (dados.documento && documentoClienteJaCadastrado(dados.documento)) {
    throw new Error("Já existe um cliente cadastrado com este CPF/CNPJ.");
  }

  const clientes = lerClientes();

  const agora = obterAgora();

  const documento = dados.documento
    ? normalizarDocumento(dados.documento)
    : undefined;

  const cliente: Cliente = {
    ...dados,

    documento,

    id: gerarId(),

    codigo: gerarCodigo(clientes),

    dataCadastro: agora,

    dataAtualizacao: agora,
  };

  clientes.push(cliente);

  salvarClientes(clientes);

  return cliente;
}

/* =========================================================
   ATUALIZAR CLIENTE
   ========================================================= */

export function atualizarCliente(
  id: string,
  dados: Partial<Omit<Cliente, "id" | "codigo" | "dataCadastro">>,
): Cliente | null {
  const clientes = lerClientes();

  const indice = clientes.findIndex((cliente) => cliente.id === id);

  if (indice === -1) {
    return null;
  }

  const clienteExistente = clientes[indice];

  const clienteAtualizado: Cliente = {
    ...clienteExistente,

    ...dados,

    id: clienteExistente.id,

    codigo: clienteExistente.codigo,

    dataCadastro: clienteExistente.dataCadastro,

    dataAtualizacao: obterAgora(),
  };

  const erro = validarDadosCliente(clienteAtualizado);

  if (erro) {
    throw new Error(erro);
  }

  if (
    clienteAtualizado.documento &&
    documentoClienteJaCadastrado(clienteAtualizado.documento, id)
  ) {
    throw new Error("Já existe outro cliente cadastrado com este CPF/CNPJ.");
  }

  clienteAtualizado.documento = clienteAtualizado.documento
    ? normalizarDocumento(clienteAtualizado.documento)
    : undefined;

  clientes[indice] = clienteAtualizado;

  salvarClientes(clientes);

  return clienteAtualizado;
}

/* =========================================================
   ALTERAR STATUS
   ========================================================= */

export function alterarStatusCliente(
  id: string,
  status: StatusCliente,
): Cliente | null {
  return atualizarCliente(id, {
    status,
  });
}

/* =========================================================
   ATIVAR CLIENTE
   ========================================================= */

export function ativarCliente(id: string): Cliente | null {
  return alterarStatusCliente(id, "ativo");
}

/* =========================================================
   INATIVAR CLIENTE
   ========================================================= */

export function inativarCliente(id: string): Cliente | null {
  return alterarStatusCliente(id, "inativo");
}

/* =========================================================
   EXCLUIR CLIENTE
   ========================================================= */

export function excluirCliente(id: string): boolean {
  const clientes = lerClientes();

  const quantidadeAnterior = clientes.length;

  const clientesAtualizados = clientes.filter((cliente) => cliente.id !== id);

  if (clientesAtualizados.length === quantidadeAnterior) {
    return false;
  }

  salvarClientes(clientesAtualizados);

  return true;
}

/* =========================================================
   PESQUISA
   ========================================================= */

export function pesquisarClientes(termo: string): Cliente[] {
  const clientes = lerClientes();

  const busca = termo.trim().toLowerCase();

  if (!busca) {
    return clientes;
  }

  return clientes.filter((cliente) => {
    const campos = [
      cliente.codigo,
      cliente.nome,
      cliente.nomeFantasia,
      cliente.documento,
      cliente.email,
      cliente.telefone,
      cliente.celular,
      cliente.cidade,
      cliente.estado,
    ];

    return campos.some((campo) => campo?.toLowerCase().includes(busca));
  });
}

/* =========================================================
   FILTRAR POR STATUS
   ========================================================= */

export function obterClientesPorStatus(status: StatusCliente): Cliente[] {
  return lerClientes().filter((cliente) => cliente.status === status);
}

/* =========================================================
   RESUMO
   ========================================================= */

export interface ResumoClientes {
  total: number;
  ativos: number;
  inativos: number;
}

export function obterResumoClientes(): ResumoClientes {
  const clientes = lerClientes();

  const ativos = clientes.filter(
    (cliente) => cliente.status === "ativo",
  ).length;

  const inativos = clientes.filter(
    (cliente) => cliente.status === "inativo",
  ).length;

  return {
    total: clientes.length,

    ativos,

    inativos,
  };
}

/* =========================================================
   LABELS
   ========================================================= */

export function obterTipoClienteLabel(tipo: TipoCliente): string {
  switch (tipo) {
    case "fisica":
      return "Pessoa Física";

    case "juridica":
      return "Pessoa Jurídica";

    default:
      return tipo;
  }
}

export function obterStatusClienteLabel(status: StatusCliente): string {
  switch (status) {
    case "ativo":
      return "Ativo";

    case "inativo":
      return "Inativo";

    default:
      return status;
  }
}

/* =========================================================
   VALIDAÇÃO
   ========================================================= */

export function validarDadosCliente(dados: Partial<Cliente>): string | null {
  if (!dados.nome?.trim()) {
    return "Informe o nome do cliente.";
  }

  if (dados.tipo !== "fisica" && dados.tipo !== "juridica") {
    return "Informe o tipo de cliente.";
  }

  /*
   * Documento é opcional.
   *
   * Porém, se for informado,
   * obrigatoriamente precisa ser
   * um CPF ou CNPJ válido.
   */

  if (dados.documento?.trim()) {
    const documento = normalizarDocumento(dados.documento);

    if (dados.tipo === "fisica") {
      if (!validarCPF(documento)) {
        return "CPF inválido. Informe um CPF válido com 11 dígitos.";
      }
    }

    if (dados.tipo === "juridica") {
      if (!validarCNPJ(documento)) {
        return "CNPJ inválido. Informe um CNPJ válido com 14 dígitos.";
      }
    }
  }

  if (
    dados.email?.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email.trim())
  ) {
    return "Informe um e-mail válido.";
  }

  return null;
}

/* =========================================================
   VERIFICAR DOCUMENTO
   ========================================================= */

export function documentoClienteJaCadastrado(
  documento: string,
  ignorarId?: string,
): boolean {
  const documentoNormalizado = normalizarDocumento(documento);

  if (!documentoNormalizado) {
    return false;
  }

  return lerClientes().some((cliente) => {
    if (ignorarId && cliente.id === ignorarId) {
      return false;
    }

    const documentoCliente = normalizarDocumento(cliente.documento);

    return documentoCliente === documentoNormalizado;
  });
}

/* =========================================================
   CONTAGEM
   ========================================================= */

export function contarClientesAtivos(): number {
  return obterClientesPorStatus("ativo").length;
}

export function contarClientesInativos(): number {
  return obterClientesPorStatus("inativo").length;
}

/* =========================================================
   EVENTO DE ATUALIZAÇÃO
   ========================================================= */

export function obterEventoClientesAtualizados() {
  return EVENTO_ATUALIZADO;
}
