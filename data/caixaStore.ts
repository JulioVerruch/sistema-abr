/**
 * Caixa / Fluxo de Caixa
 * Sistema ABR Agro
 *
 * Store responsável por registrar entradas e saídas financeiras.
 *
 * Neste primeiro estágio:
 * - entradas de recebimentos de vendas;
 * - saídas de pagamentos de compras;
 * - lançamentos manuais;
 * - estorno de lançamentos;
 * - filtros e resumo do caixa.
 *
 * Os lançamentos são persistidos em localStorage para manter o padrão
 * atual do sistema enquanto a aplicação ainda estiver trabalhando localmente.
 */

export type TipoLancamentoCaixa = "entrada" | "saida";

export type OrigemLancamentoCaixa =
  | "venda"
  | "compra"
  | "manual"
  | "ajuste"
  | "estorno";

export interface LancamentoCaixa {
  id: string;

  tipo: TipoLancamentoCaixa;

  origem: OrigemLancamentoCaixa;

  descricao: string;

  valor: number;

  data: string;

  formaPagamento?: string;

  vendaId?: string;

  vendaNumero?: string;

  contaReceberId?: string;

  compraId?: string;

  compraNumero?: string;

  contaPagarId?: string;

  categoria?: string;

  observacao?: string;

  /** ID do lançamento original quando este lançamento for um estorno. */
  lancamentoOrigemId?: string;

  /** Indica se o lançamento foi estornado. */
  estornado?: boolean;

  criadoEm: string;
  atualizadoEm: string;
}

export interface CriarLancamentoCaixaParams {
  tipo: TipoLancamentoCaixa;

  origem: OrigemLancamentoCaixa;

  descricao: string;

  valor: number;

  data?: string;

  formaPagamento?: string;

  vendaId?: string;

  vendaNumero?: string;

  contaReceberId?: string;

  compraId?: string;

  compraNumero?: string;

  contaPagarId?: string;

  categoria?: string;

  observacao?: string;

  lancamentoOrigemId?: string;
}

const STORAGE_KEY = "abr-agro-caixa";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function agora(): string {
  return new Date().toISOString();
}

function arredondar(valor: number): number {
  return Math.round((Number(valor) || 0) * 100) / 100;
}

function gerarId(prefixo: string): string {
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function lerLancamentos(): LancamentoCaixa[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const bruto = window.localStorage.getItem(STORAGE_KEY);

    if (!bruto) {
      return [];
    }

    const dados = JSON.parse(bruto);

    if (!Array.isArray(dados)) {
      return [];
    }

    return dados;
  } catch {
    return [];
  }
}

const EVENTO_ATUALIZADO = "abr-agro-caixa-atualizado";

function salvarLancamentos(lancamentos: LancamentoCaixa[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lancamentos));

  window.dispatchEvent(new CustomEvent(EVENTO_ATUALIZADO));
}

export function listarLancamentosCaixa(): LancamentoCaixa[] {
  return lerLancamentos().sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  );
}

export function obterLancamentoCaixa(id: string): LancamentoCaixa | null {
  return lerLancamentos().find((lancamento) => lancamento.id === id) ?? null;
}

export function criarLancamentoCaixa(
  dados: CriarLancamentoCaixaParams,
): LancamentoCaixa {
  const valor = arredondar(dados.valor);

  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error("O valor do lançamento deve ser maior que zero.");
  }

  if (!dados.descricao.trim()) {
    throw new Error("Informe uma descrição para o lançamento.");
  }

  const agoraISO = agora();

  const lancamento: LancamentoCaixa = {
    id: gerarId("caixa"),

    tipo: dados.tipo,

    origem: dados.origem,

    descricao: dados.descricao.trim(),

    valor,

    data: dados.data ?? agoraISO,

    formaPagamento: dados.formaPagamento,

    vendaId: dados.vendaId,

    vendaNumero: dados.vendaNumero,

    contaReceberId: dados.contaReceberId,

    compraId: dados.compraId,

    compraNumero: dados.compraNumero,

    contaPagarId: dados.contaPagarId,

    categoria: dados.categoria,

    observacao: dados.observacao?.trim() || undefined,

    lancamentoOrigemId: dados.lancamentoOrigemId,

    estornado: false,

    criadoEm: agoraISO,

    atualizadoEm: agoraISO,
  };

  const lancamentos = lerLancamentos();

  lancamentos.push(lancamento);

  salvarLancamentos(lancamentos);

  return lancamento;
}

/**
 * Registra uma entrada proveniente de um recebimento
 * de conta a receber.
 *
 * A verificação por conta/parcela deve ser feita pela camada
 * que possui o ID específico do recebimento. O store mantém
 * apenas o lançamento financeiro.
 */
export function registrarEntradaVenda(dados: {
  valor: number;
  data?: string;
  formaPagamento?: string;
  vendaId?: string;
  vendaNumero?: string;
  contaReceberId?: string;
  descricao?: string;
  categoria?: string;
  observacao?: string;
}): LancamentoCaixa {
  const lancamentos = lerLancamentos();

  const existente = lancamentos.find(
    (lancamento) =>
      lancamento.tipo === "entrada" &&
      lancamento.origem === "venda" &&
      lancamento.contaReceberId === dados.contaReceberId &&
      lancamento.observacao === dados.observacao,
  );

  if (existente) {
    return existente;
  }

  return criarLancamentoCaixa({
    tipo: "entrada",
    origem: "venda",

    descricao:
      dados.descricao ??
      `Recebimento da venda ${
        dados.vendaNumero ? `#${dados.vendaNumero}` : ""
      }`.trim(),

    valor: dados.valor,
    data: dados.data,
    formaPagamento: dados.formaPagamento,
    vendaId: dados.vendaId,
    vendaNumero: dados.vendaNumero,
    contaReceberId: dados.contaReceberId,
    categoria: dados.categoria ?? "Vendas",
    observacao: dados.observacao,
  });
}

/**
 * Registra uma saída relacionada a uma compra.
 *
 * Será utilizada posteriormente pelo Contas a Pagar.
 */
export function registrarSaidaCompra(dados: {
  valor: number;
  data?: string;
  formaPagamento?: string;
  compraId?: string;
  compraNumero?: string;
  contaPagarId?: string;
  descricao?: string;
  categoria?: string;
  observacao?: string;
}): LancamentoCaixa {
  const lancamentos = lerLancamentos();

  const existente = lancamentos.find(
    (lancamento) =>
      lancamento.tipo === "saida" &&
      lancamento.origem === "compra" &&
      lancamento.contaPagarId === dados.contaPagarId &&
      lancamento.observacao === dados.observacao,
  );

  if (existente) {
    return existente;
  }

  return criarLancamentoCaixa({
    tipo: "saida",
    origem: "compra",

    descricao:
      dados.descricao ??
      `Pagamento da compra ${
        dados.compraNumero ? `#${dados.compraNumero}` : ""
      }`.trim(),

    valor: dados.valor,
    data: dados.data,
    formaPagamento: dados.formaPagamento,
    compraId: dados.compraId,
    compraNumero: dados.compraNumero,
    contaPagarId: dados.contaPagarId,
    categoria: dados.categoria ?? "Compras",
    observacao: dados.observacao,
  });
}

/**
 * Cria um lançamento manual de entrada ou saída.
 */
export function registrarLancamentoManual(dados: {
  tipo: TipoLancamentoCaixa;

  valor: number;

  descricao: string;

  data?: string;

  formaPagamento?: string;

  categoria?: string;

  observacao?: string;
}): LancamentoCaixa {
  return criarLancamentoCaixa({
    tipo: dados.tipo,

    origem: "manual",

    descricao: dados.descricao,

    valor: dados.valor,

    data: dados.data,

    formaPagamento: dados.formaPagamento,

    categoria: dados.categoria ?? "Lançamento manual",

    observacao: dados.observacao,
  });
}

/**
 * Estorna um lançamento de caixa sem apagar o histórico original.
 *
 * O lançamento original permanece armazenado e marcado como estornado.
 * Um novo lançamento de valor oposto é criado para preservar o histórico.
 */
export function estornarLancamentoCaixa(id: string): {
  sucesso: boolean;
  mensagem: string;
  lancamento?: LancamentoCaixa;
} {
  const lancamentos = lerLancamentos();

  const indice = lancamentos.findIndex((item) => item.id === id);

  if (indice === -1) {
    return {
      sucesso: false,
      mensagem: "Lançamento de caixa não encontrado.",
    };
  }

  const original = lancamentos[indice];

  if (original.estornado) {
    return {
      sucesso: false,
      mensagem: "Este lançamento já foi estornado.",
    };
  }

  const agoraISO = agora();

  const estorno: LancamentoCaixa = {
    id: gerarId("caixa-estorno"),

    tipo: original.tipo === "entrada" ? "saida" : "entrada",

    origem: "estorno",

    descricao: `Estorno: ${original.descricao}`,

    valor: original.valor,

    data: agoraISO,

    formaPagamento: original.formaPagamento,

    vendaId: original.vendaId,

    vendaNumero: original.vendaNumero,

    contaReceberId: original.contaReceberId,

    compraId: original.compraId,

    compraNumero: original.compraNumero,

    contaPagarId: original.contaPagarId,

    categoria: original.categoria,

    observacao: `Estorno do lançamento ${original.id}.`,

    lancamentoOrigemId: original.id,

    estornado: false,

    criadoEm: agoraISO,

    atualizadoEm: agoraISO,
  };

  lancamentos[indice] = {
    ...original,

    estornado: true,

    atualizadoEm: agoraISO,
  };

  lancamentos.push(estorno);

  salvarLancamentos(lancamentos);

  return {
    sucesso: true,
    mensagem: "Lançamento estornado com sucesso.",
    lancamento: estorno,
  };
}

export function excluirLancamentoCaixa(id: string): boolean {
  const lancamentos = lerLancamentos();

  const novos = lancamentos.filter((item) => item.id !== id);

  if (novos.length === lancamentos.length) {
    return false;
  }

  salvarLancamentos(novos);

  return true;
}

export function buscarLancamentosCaixa(termo: string): LancamentoCaixa[] {
  const busca = termo.trim().toLowerCase();

  if (!busca) {
    return listarLancamentosCaixa();
  }

  return listarLancamentosCaixa().filter((lancamento) =>
    [
      lancamento.id,
      lancamento.descricao,
      lancamento.origem,
      lancamento.categoria,
      lancamento.formaPagamento,
      lancamento.vendaNumero,
      lancamento.compraNumero,
      lancamento.observacao,
    ]
      .filter(Boolean)
      .some((valor) => String(valor).toLowerCase().includes(busca)),
  );
}

export function obterResumoCaixa(
  dataInicio?: string,
  dataFim?: string,
): {
  entradas: number;
  saidas: number;
  saldo: number;
  quantidadeEntradas: number;
  quantidadeSaidas: number;
} {
  let lancamentos = listarLancamentosCaixa();

  if (dataInicio) {
    const inicio = new Date(`${dataInicio}T00:00:00`);

    lancamentos = lancamentos.filter(
      (lancamento) => new Date(lancamento.data) >= inicio,
    );
  }

  if (dataFim) {
    const fim = new Date(`${dataFim}T23:59:59.999`);

    lancamentos = lancamentos.filter(
      (lancamento) => new Date(lancamento.data) <= fim,
    );
  }

  const validos = lancamentos.filter((lancamento) => !lancamento.estornado);

  const entradas = arredondar(
    validos
      .filter((lancamento) => lancamento.tipo === "entrada")
      .reduce((total, lancamento) => total + lancamento.valor, 0),
  );

  const saidas = arredondar(
    validos
      .filter((lancamento) => lancamento.tipo === "saida")
      .reduce((total, lancamento) => total + lancamento.valor, 0),
  );

  return {
    entradas,

    saidas,

    saldo: arredondar(entradas - saidas),

    quantidadeEntradas: validos.filter(
      (lancamento) => lancamento.tipo === "entrada",
    ).length,

    quantidadeSaidas: validos.filter(
      (lancamento) => lancamento.tipo === "saida",
    ).length,
  };
}

export function obterSaldoCaixa(): number {
  return obterResumoCaixa().saldo;
}

/**
 * Retorna somente os lançamentos relacionados a uma conta a receber.
 */
export function listarLancamentosPorContaReceber(
  contaReceberId: string,
): LancamentoCaixa[] {
  return listarLancamentosCaixa().filter(
    (lancamento) => lancamento.contaReceberId === contaReceberId,
  );
}

/**
 * Retorna somente os lançamentos relacionados a uma venda.
 */
export function listarLancamentosPorVenda(vendaId: string): LancamentoCaixa[] {
  return listarLancamentosCaixa().filter(
    (lancamento) => lancamento.vendaId === vendaId,
  );
}

/**
 * Retorna somente os lançamentos relacionados a uma compra.
 */
export function listarLancamentosPorCompra(
  compraId: string,
): LancamentoCaixa[] {
  return listarLancamentosCaixa().filter(
    (lancamento) => lancamento.compraId === compraId,
  );
}
