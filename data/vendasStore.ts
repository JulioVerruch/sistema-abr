import { obterProdutos } from "./produtosStore";
import { registrarMovimentacao } from "./movimentacoesStore";

import { estornarLancamentoCaixa, listarLancamentosCaixa } from "./caixaStore";
import {
  obterConfiguracoes,
  atualizarConfiguracoes,
} from "./configuracoesStore";

import {
  cancelarContaReceber,
  criarContaReceberDaVenda,
  listarContasPorVenda,
  registrarRecebimento,
} from "./contasReceberStore";

/* =========================================================
   TIPOS
   ========================================================= */

export type StatusVenda = "rascunho" | "pendente" | "concluida" | "cancelada";

export type FormaPagamento =
  | "pix"
  | "dinheiro"
  | "cartao_credito"
  | "cartao_debito"
  | "boleto"
  | "transferencia"
  | "outro";

export type TipoCondicaoPagamento = "avista" | "parcelado";

export interface ParcelaVenda {
  id: string;
  numero: number;
  valor: number;
  vencimento: string;
  valorRecebido: number;
  status: "pendente" | "parcial" | "recebida" | "cancelada";
}

export interface CondicaoPagamentoVenda {
  tipo: TipoCondicaoPagamento;
  quantidadeParcelas: number;
  intervaloDias: number;
  entrada: number;
  parcelas: ParcelaVenda[];
}

export interface ItemVenda {
  id: string;

  produtoId: string;

  produtoNome: string;

  quantidade: number;

  precoUnitario: number;

  /**
   * Custo unitário histórico do produto no momento em que
   * a venda foi concluída.
   *
   * Opcional para manter compatibilidade com vendas antigas
   * que foram gravadas antes deste campo existir.
   */
  custoUnitario?: number;

  desconto: number;

  subtotal: number;
}

export interface Venda {
  id: string;

  numero: string;

  clienteId: string;

  clienteNome: string;

  itens: ItemVenda[];

  subtotal: number;

  desconto: number;

  total: number;

  formaPagamento?: FormaPagamento;

  /** Condição comercial/financeira da venda. */
  condicaoPagamento?: CondicaoPagamentoVenda;

  /** Total já recebido financeiramente. */
  valorRecebido?: number;

  /** Saldo financeiro ainda em aberto. */
  saldoReceber?: number;

  status: StatusVenda;

  dataVenda: string;

  dataCriacao: string;

  dataAtualizacao: string;

  observacao?: string;

  /** Indica que a saída de estoque desta venda já foi registrada. */
  estoqueBaixado?: boolean;

  /** Indica que uma eventual saída de estoque já foi estornada. */
  estoqueEstornado?: boolean;
}

export interface DadosNovaVenda {
  clienteId: string;

  clienteNome: string;

  itens: ItemVenda[];

  subtotal: number;

  desconto: number;

  total: number;

  formaPagamento?: FormaPagamento;

  condicaoPagamento?: CondicaoPagamentoVenda;

  valorRecebido?: number;

  saldoReceber?: number;

  status?: StatusVenda;

  observacao?: string;
}

/* =========================================================
   CONFIGURAÇÃO
   ========================================================= */

const STORAGE_KEY = "abr-agro-vendas";

const EVENTO_ATUALIZADO = "abr-agro-vendas-atualizadas";

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function gerarId(): string {
  return `venda-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function obterAgora(): string {
  return new Date().toISOString();
}

/* =========================================================
   LEITURA / ESCRITA
   ========================================================= */

function lerVendas(): Venda[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const dados = window.localStorage.getItem(STORAGE_KEY);

    if (!dados) {
      return [];
    }

    const vendas = JSON.parse(dados);

    if (!Array.isArray(vendas)) {
      return [];
    }

    return vendas;
  } catch (error) {
    console.error("Erro ao carregar vendas:", error);

    return [];
  }
}

function salvarVendas(vendas: Venda[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vendas));

    window.dispatchEvent(new CustomEvent(EVENTO_ATUALIZADO));
  } catch (error) {
    console.error("Erro ao salvar vendas:", error);
  }
}

/* =========================================================
   NÚMERO DA VENDA
   ========================================================= */

function gerarNumeroVenda(vendas: Venda[]): string {
  const configuracoes = obterConfiguracoes().comercial;
  let maiorNumero = 0;

  for (const venda of vendas) {
    const numero = Number(venda.numero.replace(/\D/g, ""));

    if (Number.isFinite(numero) && numero > maiorNumero) {
      maiorNumero = numero;
    }
  }

  const configurado = Math.max(
    1,
    Math.floor(Number(configuracoes.proximoNumeroVenda) || 1),
  );

  const proximo = Math.max(configurado, maiorNumero + 1);
  const prefixo = configuracoes.prefixoVenda.trim().toUpperCase();

  return `${prefixo}${String(proximo).padStart(5, "0")}`;
}

/* =========================================================
   CÁLCULO DE ITEM
   ========================================================= */

export function calcularSubtotalItem(
  quantidade: number,
  precoUnitario: number,
  desconto = 0,
): number {
  const subtotalBruto = quantidade * precoUnitario;

  const valorDesconto = Math.max(0, desconto);

  return Math.max(0, subtotalBruto - valorDesconto);
}

/* =========================================================
   CÁLCULO DA VENDA
   ========================================================= */

export function calcularSubtotalVenda(itens: ItemVenda[]): number {
  return itens.reduce((total, item) => total + item.subtotal, 0);
}

export function calcularTotalVenda(subtotal: number, desconto = 0): number {
  return Math.max(0, subtotal - Math.max(0, desconto));
}

/* =========================================================
   RECALCULAR ITEM
   ========================================================= */

export function recalcularItemVenda(item: ItemVenda): ItemVenda {
  return {
    ...item,

    subtotal: calcularSubtotalItem(
      item.quantidade,
      item.precoUnitario,
      item.desconto,
    ),
  };
}

/* =========================================================
   CUSTO HISTÓRICO DA VENDA
   ========================================================= */

/**
 * Captura o custo atual do produto no momento em que a venda
 * é efetivamente concluída.
 *
 * O valor fica gravado dentro do item da venda e não muda
 * quando o custo cadastrado do produto for alterado depois.
 *
 * Itens que já possuem custoUnitario são preservados para
 * evitar sobrescrever um custo histórico existente.
 */
function converterCustoProduto(valor: string | number): number {
  if (typeof valor === "number") {
    return valor;
  }

  return Number(
    valor.replace("R$", "").replace(/\\./g, "").replace(",", ".").trim(),
  );
}

function capturarCustoHistoricoItens(itens: ItemVenda[]): ItemVenda[] {
  const produtos = obterProdutos();

  return itens.map((item) => {
    const custoExistente = Number(item.custoUnitario);

    if (Number.isFinite(custoExistente) && custoExistente >= 0) {
      return item;
    }

    const produto = produtos.find(
      (produtoAtual) =>
        String(produtoAtual.id) === String(item.produtoId) ||
        produtoAtual.codigo === String(item.produtoId),
    );

    if (!produto) {
      throw new Error(
        `O produto "${item.produtoNome}" não foi encontrado para registrar o custo histórico.`,
      );
    }

    const custo = converterCustoProduto(produto.custo);

    if (!Number.isFinite(custo) || custo < 0) {
      throw new Error(
        `O custo do produto "${produto.nome}" é inválido. Cadastre um custo válido antes de concluir a venda.`,
      );
    }

    return {
      ...item,
      custoUnitario: Math.round(custo * 100) / 100,
    };
  });
}

/* =========================================================
   RECALCULAR VENDA
   ========================================================= */

export function recalcularVenda(
  venda: Partial<Venda>,
): Pick<Venda, "subtotal" | "desconto" | "total"> {
  const itens = (venda.itens ?? []).map(recalcularItemVenda);

  const subtotal = calcularSubtotalVenda(itens);

  const desconto = Math.max(0, venda.desconto ?? 0);

  const total = calcularTotalVenda(subtotal, desconto);

  return {
    subtotal,
    desconto,
    total,
  };
}

/* =========================================================
   FINANCEIRO DA VENDA
   ========================================================= */

function normalizarData(data: Date): string {
  return data.toISOString();
}

export function gerarParcelasVenda(
  total: number,
  quantidadeParcelas: number,
  intervaloDias = 30,
  primeiraVencimento?: string,
): ParcelaVenda[] {
  const valorTotal = Math.max(0, Number(total) || 0);
  const quantidade = Math.max(1, Math.floor(Number(quantidadeParcelas) || 1));
  const intervalo = Math.max(1, Math.floor(Number(intervaloDias) || 30));

  const valorBase = Math.round((valorTotal / quantidade) * 100) / 100;

  const parcelas: ParcelaVenda[] = [];
  let acumulado = 0;

  for (let indice = 0; indice < quantidade; indice += 1) {
    const valor =
      indice === quantidade - 1
        ? Math.round((valorTotal - acumulado) * 100) / 100
        : valorBase;

    acumulado += valor;

    const vencimento = primeiraVencimento
      ? new Date(primeiraVencimento)
      : new Date();

    if (Number.isNaN(vencimento.getTime())) {
      throw new Error("A data de vencimento é inválida.");
    }

    vencimento.setDate(vencimento.getDate() + indice * intervalo);

    parcelas.push({
      id: `parcela-${Date.now()}-${indice}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      numero: indice + 1,
      valor,
      vencimento: normalizarData(vencimento),
      valorRecebido: 0,
      status: "pendente",
    });
  }

  return parcelas;
}

export function criarCondicaoPagamentoVenda(
  total: number,
  tipo: TipoCondicaoPagamento = "avista",
  quantidadeParcelas = 1,
  intervaloDias = 30,
  primeiraVencimento?: string,
): CondicaoPagamentoVenda {
  const valorTotal = Math.max(0, Number(total) || 0);

  if (tipo === "avista") {
    return {
      tipo: "avista",
      quantidadeParcelas: 1,
      intervaloDias: 0,
      entrada: valorTotal,
      parcelas: [
        {
          id: `parcela-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          numero: 1,
          valor: valorTotal,
          vencimento: primeiraVencimento
            ? new Date(primeiraVencimento).toISOString()
            : new Date().toISOString(),
          valorRecebido: 0,
          status: "pendente",
        },
      ],
    };
  }

  const parcelas = gerarParcelasVenda(
    valorTotal,
    quantidadeParcelas,
    intervaloDias,
    primeiraVencimento,
  );

  return {
    tipo: "parcelado",
    quantidadeParcelas: parcelas.length,
    intervaloDias: Math.max(1, Math.floor(Number(intervaloDias) || 30)),
    entrada: 0,
    parcelas,
  };
}

export function recalcularFinanceiroVenda(
  venda: Pick<Venda, "total" | "condicaoPagamento" | "valorRecebido">,
): Pick<Venda, "valorRecebido" | "saldoReceber"> {
  const recebido = Math.max(0, Number(venda.valorRecebido) || 0);

  const total = Math.max(0, Number(venda.total) || 0);

  return {
    valorRecebido: Math.min(recebido, total),
    saldoReceber: Math.max(0, Math.round((total - recebido) * 100) / 100),
  };
}

/* =========================================================
   CONFIGURAÇÕES OPERACIONAIS
   ========================================================= */

function formaPagamentoHabilitada(forma?: FormaPagamento): boolean {
  if (!forma) return false;

  const formas = obterConfiguracoes().comercial.formasPagamento;

  return formas.includes(forma);
}

function validarRegrasComerciaisVenda(
  dados: Partial<DadosNovaVenda>,
): string | null {
  const configuracoes = obterConfiguracoes();

  if (configuracoes.comercial.exigirClienteVenda && !dados.clienteId) {
    return "Selecione um cliente conforme a configuração comercial.";
  }

  if (dados.formaPagamento && !formaPagamentoHabilitada(dados.formaPagamento)) {
    return "A forma de pagamento selecionada está desativada nas configurações.";
  }

  const subtotal = Math.max(0, Number(dados.subtotal) || 0);
  const desconto = Math.max(0, Number(dados.desconto) || 0);
  const descontoMaximo = Math.max(
    0,
    Number(configuracoes.comercial.descontoMaximoPercentual) || 0,
  );

  if (
    subtotal > 0 &&
    desconto > 0 &&
    descontoMaximo >= 0 &&
    (desconto / subtotal) * 100 > descontoMaximo + 0.0001
  ) {
    return `O desconto excede o limite configurado de ${descontoMaximo}%`;
  }

  return null;
}

function consumirNumeroVenda(numero: string): void {
  const configuracoes = obterConfiguracoes();
  const numeroUsado = Number(numero.replace(/\D/g, ""));

  if (!Number.isFinite(numeroUsado)) return;

  atualizarConfiguracoes({
    comercial: {
      ...configuracoes.comercial,
      proximoNumeroVenda: Math.max(
        configuracoes.comercial.proximoNumeroVenda,
        numeroUsado + 1,
      ),
    },
  });
}

/* =========================================================
   VALIDAÇÃO
   ========================================================= */

export function validarItemVenda(item: Partial<ItemVenda>): string | null {
  if (!item.produtoId) {
    return "Selecione um produto.";
  }

  if (!item.produtoNome?.trim()) {
    return "Informe o nome do produto.";
  }

  if (
    typeof item.quantidade !== "number" ||
    !Number.isFinite(item.quantidade) ||
    item.quantidade <= 0
  ) {
    return "A quantidade deve ser maior que zero.";
  }

  if (
    typeof item.precoUnitario !== "number" ||
    !Number.isFinite(item.precoUnitario) ||
    item.precoUnitario < 0
  ) {
    return "O preço unitário é inválido.";
  }

  if (!Number.isFinite(item.desconto ?? 0) || (item.desconto ?? 0) < 0) {
    return "O desconto do item é inválido.";
  }

  return null;
}

export function validarDadosVenda(
  dados: Partial<DadosNovaVenda>,
): string | null {
  const regraComercial = validarRegrasComerciaisVenda(dados);

  if (regraComercial) {
    return regraComercial;
  }

  if (!dados.clienteId && obterConfiguracoes().comercial.exigirClienteVenda) {
    return "Selecione um cliente.";
  }

  if (
    obterConfiguracoes().comercial.exigirClienteVenda &&
    !dados.clienteNome?.trim()
  ) {
    return "O nome do cliente é obrigatório.";
  }

  if (!dados.itens || dados.itens.length === 0) {
    return "Adicione pelo menos um produto à venda.";
  }

  for (const item of dados.itens) {
    const erro = validarItemVenda(item);

    if (erro) {
      return erro;
    }
  }

  if (!Number.isFinite(dados.desconto ?? 0) || (dados.desconto ?? 0) < 0) {
    return "O desconto da venda é inválido.";
  }

  if (
    typeof dados.total !== "number" ||
    !Number.isFinite(dados.total) ||
    dados.total < 0
  ) {
    return "O total da venda é inválido.";
  }

  if (dados.condicaoPagamento) {
    const condicao = dados.condicaoPagamento;

    if (
      !Number.isInteger(condicao.quantidadeParcelas) ||
      condicao.quantidadeParcelas <= 0
    ) {
      return "A quantidade de parcelas é inválida.";
    }

    if (
      !Number.isFinite(condicao.intervaloDias) ||
      condicao.intervaloDias < 0
    ) {
      return "O intervalo entre parcelas é inválido.";
    }

    if (!Array.isArray(condicao.parcelas) || condicao.parcelas.length === 0) {
      return "A condição de pagamento precisa possuir pelo menos uma parcela.";
    }
  }

  return null;
}

/* =========================================================
   ESTOQUE DA VENDA
   ========================================================= */

type QuantidadePorProduto = {
  codigo: string;
  nome: string;
  quantidade: number;
};

function obterProdutosDaVenda(
  venda: Pick<Venda, "itens">,
): QuantidadePorProduto[] {
  const produtos = obterProdutos();

  const mapa = new Map<string, QuantidadePorProduto>();

  for (const item of venda.itens) {
    const produto = produtos.find(
      (produtoAtual) =>
        String(produtoAtual.id) === String(item.produtoId) ||
        produtoAtual.codigo === String(item.produtoId),
    );

    if (!produto) {
      throw new Error(
        `O produto "${item.produtoNome}" não foi encontrado no estoque.`,
      );
    }

    const quantidade = Number(item.quantidade);

    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      throw new Error(
        `A quantidade do produto "${item.produtoNome}" é inválida.`,
      );
    }

    const existente = mapa.get(produto.codigo);

    if (existente) {
      existente.quantidade += quantidade;
    } else {
      mapa.set(produto.codigo, {
        codigo: produto.codigo,
        nome: produto.nome,
        quantidade,
      });
    }
  }

  return Array.from(mapa.values());
}

function validarEstoqueParaVenda(venda: Pick<Venda, "itens">): void {
  const produtos = obterProdutos();
  const quantidades = obterProdutosDaVenda(venda);

  for (const item of quantidades) {
    const produto = produtos.find(
      (produtoAtual) => produtoAtual.codigo === item.codigo,
    );

    if (!produto) {
      throw new Error(
        `O produto "${item.nome}" não foi encontrado no estoque.`,
      );
    }

    const estoqueAtual = Number(produto.estoque) || 0;

    if (
      item.quantidade > estoqueAtual &&
      !obterConfiguracoes().estoque.permitirEstoqueNegativo
    ) {
      throw new Error(
        `Estoque insuficiente para ${item.nome}. Disponível: ${estoqueAtual} unidade(s). Solicitado: ${item.quantidade}.`,
      );
    }
  }
}

function registrarBaixaEstoqueVenda(venda: Venda): void {
  // A mesma venda nunca pode gerar duas baixas de estoque.
  if (venda.estoqueBaixado) {
    return;
  }

  validarEstoqueParaVenda(venda);

  const itens = obterProdutosDaVenda(venda);

  for (const item of itens) {
    registrarMovimentacao({
      codigoProduto: item.codigo,
      tipo: "saida",
      motivo: "venda",
      quantidade: item.quantidade,
      observacao: `Saída automática da venda ${venda.numero}.`,
      vendaId: venda.id,
      vendaNumero: venda.numero,
    });
  }
}

function estornarEstoqueVenda(venda: Venda): void {
  const itens = obterProdutosDaVenda(venda);

  for (const item of itens) {
    registrarMovimentacao({
      codigoProduto: item.codigo,
      tipo: "entrada",
      motivo: "devolucao",
      quantidade: item.quantidade,
      observacao: `Estorno automático da venda cancelada ${venda.numero}.`,
      vendaId: venda.id,
      vendaNumero: venda.numero,
    });
  }
}
function estornarFinanceiroVenda(venda: Venda): void {
  const lancamentos = listarLancamentosCaixa();

  const lancamentosDaVenda = lancamentos.filter(
    (lancamento) =>
      lancamento.origem === "venda" &&
      lancamento.vendaId === venda.id &&
      lancamento.tipo === "entrada" &&
      !lancamento.estornado,
  );

  for (const lancamento of lancamentosDaVenda) {
    const resultado = estornarLancamentoCaixa(lancamento.id);

    if (!resultado.sucesso) {
      console.warn(
        `Não foi possível estornar o lançamento ${lancamento.id} da venda ${venda.numero}:`,
        resultado.mensagem,
      );
    }
  }
}

/* =========================================================
   SINCRONIZAÇÃO FINANCEIRA
   ========================================================= */

function sincronizarContaReceberDaVenda(venda: Venda): void {
  if (venda.status !== "concluida") {
    return;
  }

  const conta = criarContaReceberDaVenda(venda);

  if (!conta) {
    return;
  }

  /*
   * A conta é criada com as parcelas da venda.
   * Caso já exista algum valor recebido na venda, registramos
   * esse recebimento no título para manter Vendas e Financeiro
   * sincronizados.
   */
  const valorRecebidoVenda = Math.max(0, Number(venda.valorRecebido) || 0);

  // A sincronização precisa ser idempotente. Se a venda for salva/concluída
  // novamente, não podemos registrar no Caixa um recebimento que já foi
  // registrado anteriormente. Portanto, consideramos apenas a diferença
  // entre o total recebido na venda e o que já consta na conta a receber.
  const valorRecebidoNaConta = Math.max(0, Number(conta.valorRecebido) || 0);
  const diferencaRecebimento =
    Math.round((valorRecebidoVenda - valorRecebidoNaConta) * 100) / 100;

  if (diferencaRecebimento <= 0 || conta.status === "recebida") {
    return;
  }

  let restante = Math.min(diferencaRecebimento, conta.saldo);

  for (const parcela of conta.parcelas) {
    if (restante <= 0) {
      break;
    }

    if (parcela.status === "cancelada" || parcela.saldo <= 0) {
      continue;
    }

    const valorParcela = Math.min(restante, parcela.saldo);

    if (valorParcela <= 0) {
      continue;
    }

    const resultado = registrarRecebimento({
      contaId: conta.id,
      parcelaId: parcela.id,
      valor: valorParcela,
      formaPagamento: venda.formaPagamento,
      observacao: `Recebimento inicial da venda ${venda.numero}.`,
    });

    if (!resultado.sucesso) {
      console.warn(
        `Não foi possível sincronizar o recebimento da venda ${venda.numero}:`,
        resultado.mensagem,
      );
      break;
    }

    restante = Math.round((restante - valorParcela) * 100) / 100;
  }
}

/* =========================================================
   CRIAR VENDA
   ========================================================= */

export function criarVenda(dados: DadosNovaVenda): Venda {
  const erro = validarDadosVenda(dados);

  if (erro) {
    throw new Error(erro);
  }

  const vendas = lerVendas();
  const agora = obterAgora();

  const itensBase =
    dados.status === "concluida"
      ? capturarCustoHistoricoItens(dados.itens)
      : dados.itens;

  const itens = itensBase.map((item) => recalcularItemVenda(item));

  const subtotal = calcularSubtotalVenda(itens);
  const desconto = Math.max(0, dados.desconto);
  const total = calcularTotalVenda(subtotal, desconto);

  const venda: Venda = {
    id: gerarId(),
    numero: gerarNumeroVenda(vendas),
    clienteId: dados.clienteId,
    clienteNome: dados.clienteNome.trim(),
    itens,
    subtotal,
    desconto,
    total,
    formaPagamento: dados.formaPagamento,
    condicaoPagamento: dados.condicaoPagamento,
    valorRecebido: Math.max(0, Number(dados.valorRecebido) || 0),
    saldoReceber: Math.max(
      0,
      Math.round(
        (total - Math.max(0, Number(dados.valorRecebido) || 0)) * 100,
      ) / 100,
    ),
    status: dados.status ?? "rascunho",
    dataVenda: agora,
    dataCriacao: agora,
    dataAtualizacao: agora,
    observacao: dados.observacao?.trim() || undefined,
    estoqueBaixado: false,
    estoqueEstornado: false,
  };

  /*
   * Se a venda já nascer concluída, a saída do estoque
   * precisa acontecer antes de salvar a venda.
   *
   * Assim, uma venda concluída nunca fica registrada
   * sem a respectiva baixa de estoque.
   */
  if (venda.status === "concluida") {
    if (!venda.formaPagamento) {
      throw new Error("Informe a forma de pagamento para concluir a venda.");
    }

    if (!formaPagamentoHabilitada(venda.formaPagamento)) {
      throw new Error(
        "A forma de pagamento selecionada está desativada nas configurações.",
      );
    }

    registrarBaixaEstoqueVenda(venda);
    venda.estoqueBaixado = true;
  }

  vendas.push(venda);
  salvarVendas(vendas);
  consumirNumeroVenda(venda.numero);

  // Venda concluída gera automaticamente a conta financeira.
  sincronizarContaReceberDaVenda(venda);

  return venda;
}

/* =========================================================
   OBTER VENDAS
   ========================================================= */

export function obterVendas(): Venda[] {
  return lerVendas();
}

/* =========================================================
   OBTER VENDA POR ID
   ========================================================= */

export function obterVendaPorId(id: string): Venda | null {
  const vendas = lerVendas();

  return vendas.find((venda) => venda.id === id) ?? null;
}

/* =========================================================
   OBTER VENDA POR NÚMERO
   ========================================================= */

export function obterVendaPorNumero(numero: string): Venda | null {
  const vendas = lerVendas();

  return vendas.find((venda) => venda.numero === numero) ?? null;
}

/* =========================================================
   ATUALIZAR VENDA
   ========================================================= */

export function atualizarVenda(
  id: string,
  dados: Partial<Omit<Venda, "id" | "numero" | "dataCriacao">>,
): Venda | null {
  const vendas = lerVendas();

  const indice = vendas.findIndex((venda) => venda.id === id);

  if (indice === -1) {
    return null;
  }

  const existente = vendas[indice];

  const vendaAtualizada: Venda = {
    ...existente,

    ...dados,

    id: existente.id,

    numero: existente.numero,

    dataCriacao: existente.dataCriacao,

    dataAtualizacao: obterAgora(),
  };

  const itens = vendaAtualizada.itens.map(recalcularItemVenda);

  const subtotal = calcularSubtotalVenda(itens);

  const desconto = Math.max(0, vendaAtualizada.desconto);

  const total = calcularTotalVenda(subtotal, desconto);

  const financeiro = recalcularFinanceiroVenda({
    total,
    condicaoPagamento: vendaAtualizada.condicaoPagamento,
    valorRecebido: vendaAtualizada.valorRecebido,
  });

  const finalizada: Venda = {
    ...vendaAtualizada,

    itens,

    subtotal,

    desconto,

    total,

    valorRecebido: financeiro.valorRecebido,

    saldoReceber: financeiro.saldoReceber,
  };

  const erro = validarDadosVenda(finalizada);

  if (erro) {
    throw new Error(erro);
  }

  vendas[indice] = finalizada;

  salvarVendas(vendas);

  return finalizada;
}

/* =========================================================
   ALTERAR STATUS
   ========================================================= */

export function alterarStatusVenda(
  id: string,
  status: StatusVenda,
): Venda | null {
  if (status === "concluida") {
    const venda = obterVendaPorId(id);

    if (!venda) {
      return null;
    }

    const formaPagamento = venda.formaPagamento ?? "outro";

    return concluirVenda(id, formaPagamento);
  }

  if (status === "cancelada") {
    return cancelarVenda(id);
  }

  return atualizarVenda(id, {
    status,
  });
}

/* =========================================================
   CONCLUIR VENDA
   ========================================================= */

export function concluirVenda(
  id: string,
  formaPagamento: FormaPagamento,
): Venda | null {
  const venda = obterVendaPorId(id);

  if (!venda) {
    return null;
  }

  if (venda.status === "cancelada") {
    throw new Error("Não é possível concluir uma venda cancelada.");
  }

  if (venda.status === "concluida") {
    return venda;
  }

  /*
   * O custo histórico é capturado no momento da conclusão.
   * Depois disso, alterações futuras no cadastro do produto
   * não alteram o custo desta venda.
   */
  const itensComCusto = capturarCustoHistoricoItens(venda.itens);
  const vendaComCusto: Venda = {
    ...venda,
    itens: itensComCusto,
  };

  /*
   * Primeiro validamos todo o estoque.
   * Só depois registramos as saídas.
   */
  // Só realiza a baixa se ela ainda não tiver sido feita.
  if (!venda.estoqueBaixado) {
    validarEstoqueParaVenda(vendaComCusto);
    registrarBaixaEstoqueVenda(vendaComCusto);
  }

  const vendaConcluida = atualizarVenda(id, {
    status: "concluida",
    formaPagamento,
    itens: itensComCusto,
    estoqueBaixado: true,
    estoqueEstornado: false,
  });

  if (vendaConcluida) {
    sincronizarContaReceberDaVenda(vendaConcluida);
  }

  return vendaConcluida;
}

/* =========================================================
   CANCELAR VENDA
   ========================================================= */

export function cancelarVenda(id: string): Venda | null {
  const venda = obterVendaPorId(id);

  if (!venda) {
    return null;
  }

  if (venda.status === "cancelada") {
    return venda;
  }

  /*
   * Somente vendas que realmente tiveram baixa de estoque
   * devem gerar estorno.
   */
  if (
    venda.status === "concluida" &&
    venda.estoqueBaixado &&
    !venda.estoqueEstornado
  ) {
    estornarEstoqueVenda(venda);
  }

  const vendaCancelada = atualizarVenda(id, {
    status: "cancelada",
    estoqueEstornado:
      venda.status === "concluida" && venda.estoqueBaixado
        ? true
        : venda.estoqueEstornado,
  });

  if (vendaCancelada) {
    /*
     * Primeiro estornamos valores que já entraram no Caixa.
     *
     * Isso é necessário inclusive para recebimentos parciais.
     * Exemplo:
     *
     * Venda: R$ 1.000
     * Recebido: R$ 300
     * Cancelamento:
     * Caixa: - R$ 300
     */
    if (venda.status === "concluida") {
      estornarFinanceiroVenda(vendaCancelada);
    }

    const contas = listarContasPorVenda(vendaCancelada.id);

    for (const conta of contas) {
      /*
       * Se ainda existe saldo em aberto, cancelamos a obrigação.
       *
       * Uma conta parcialmente recebida também pode ser cancelada:
       * o valor que já entrou foi estornado acima e o saldo restante
       * deixa de existir.
       */
      if (conta.status !== "cancelada") {
        const resultado = cancelarContaReceber(conta.id);

        if (!resultado.sucesso) {
          /*
           * Uma conta totalmente recebida não pode ser cancelada
           * pelo store atual. Isso não é erro fatal: o valor recebido
           * já foi estornado no Caixa.
           */
          console.warn(
            `Não foi possível cancelar a conta da venda ${vendaCancelada.numero}:`,
            resultado.mensagem,
          );
        }
      }
    }
  }

  return vendaCancelada;
}

/* =========================================================
   EXCLUIR VENDA
   ========================================================= */

export function excluirVenda(id: string): boolean {
  const vendas = lerVendas();

  const quantidadeAnterior = vendas.length;

  const atualizadas = vendas.filter((venda) => venda.id !== id);

  if (atualizadas.length === quantidadeAnterior) {
    return false;
  }

  salvarVendas(atualizadas);

  return true;
}

/* =========================================================
   PESQUISA
   ========================================================= */

export function pesquisarVendas(termo: string): Venda[] {
  const vendas = lerVendas();

  const busca = termo.trim().toLowerCase();

  if (!busca) {
    return vendas;
  }

  return vendas.filter((venda) => {
    const campos = [
      venda.numero,
      venda.clienteNome,
      venda.formaPagamento,
      venda.status,
      venda.observacao,
    ];

    return campos.some((campo) =>
      campo?.toString().toLowerCase().includes(busca),
    );
  });
}

/* =========================================================
   VENDAS POR CLIENTE
   ========================================================= */

export function obterVendasPorCliente(clienteId: string): Venda[] {
  return lerVendas().filter((venda) => venda.clienteId === clienteId);
}

/* =========================================================
   VENDAS POR STATUS
   ========================================================= */

export function obterVendasPorStatus(status: StatusVenda): Venda[] {
  return lerVendas().filter((venda) => venda.status === status);
}

/* =========================================================
   RESUMO
   ========================================================= */

export interface ResumoVendas {
  total: number;

  concluidas: number;

  pendentes: number;

  rascunhos: number;

  canceladas: number;

  valorTotal: number;

  valorConcluido: number;
}

export function obterResumoVendas(): ResumoVendas {
  const vendas = lerVendas();

  const concluidas = vendas.filter((venda) => venda.status === "concluida");

  const pendentes = vendas.filter((venda) => venda.status === "pendente");

  const rascunhos = vendas.filter((venda) => venda.status === "rascunho");

  const canceladas = vendas.filter((venda) => venda.status === "cancelada");

  const valorTotal = vendas
    .filter((venda) => venda.status !== "cancelada")
    .reduce((total, venda) => total + venda.total, 0);

  const valorConcluido = concluidas.reduce(
    (total, venda) => total + venda.total,
    0,
  );

  return {
    total: vendas.length,

    concluidas: concluidas.length,

    pendentes: pendentes.length,

    rascunhos: rascunhos.length,

    canceladas: canceladas.length,

    valorTotal,

    valorConcluido,
  };
}

/* =========================================================
   LABELS
   ========================================================= */

export function obterStatusVendaLabel(status: StatusVenda): string {
  switch (status) {
    case "rascunho":
      return "Rascunho";

    case "pendente":
      return "Pendente";

    case "concluida":
      return "Concluída";

    case "cancelada":
      return "Cancelada";

    default:
      return status;
  }
}

export function obterFormaPagamentoLabel(forma?: FormaPagamento): string {
  switch (forma) {
    case "pix":
      return "PIX";

    case "dinheiro":
      return "Dinheiro";

    case "cartao_credito":
      return "Cartão de crédito";

    case "cartao_debito":
      return "Cartão de débito";

    case "boleto":
      return "Boleto";

    case "transferencia":
      return "Transferência";

    case "outro":
      return "Outro";

    default:
      return "Não informado";
  }
}

/* =========================================================
   VALOR TOTAL DE VENDAS DO CLIENTE
   ========================================================= */

export function obterTotalVendidoParaCliente(clienteId: string): number {
  return obterVendasPorCliente(clienteId)
    .filter((venda) => venda.status !== "cancelada")
    .reduce((total, venda) => total + venda.total, 0);
}

/* =========================================================
   CONTADORES
   ========================================================= */

export function contarVendasConcluidas(): number {
  return obterVendasPorStatus("concluida").length;
}

export function contarVendasPendentes(): number {
  return obterVendasPorStatus("pendente").length;
}

export function contarVendasCanceladas(): number {
  return obterVendasPorStatus("cancelada").length;
}

/* =========================================================
   EVENTO
   ========================================================= */

export function obterEventoVendasAtualizadas(): string {
  return EVENTO_ATUALIZADO;
}
