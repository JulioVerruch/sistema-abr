/**
 * Relatórios comerciais — ABR Agro.
 *
 * Este Store é somente de leitura: consolida os dados dos Stores
 * operacionais existentes e não altera vendas, compras ou financeiro.
 */

import { obterVendas, type FormaPagamento, type Venda } from "./vendasStore";
import { obterCompras, type Compra } from "./comprasStore";
import { listarContasPagar } from "./contasPagarStore";
import { listarContasReceber } from "./contasReceberStore";
import { listarLancamentosCaixa } from "./caixaStore";
import {
  obterMovimentacoes,
  type MovimentacaoEstoque,
  type TipoMovimentacao,
} from "./movimentacoesStore";
import { obterProdutos, type Produto } from "./produtosStore";

export type PeriodoRelatorio = {
  inicio?: string;
  fim?: string;
};

export type LinhaPeriodo = {
  periodo: string;
  label: string;
  valor: number;
  quantidade: number;
};

export type LinhaPagamento = {
  forma: string;
  valor: number;
  quantidade: number;
  percentual: number;
};

export type LinhaCliente = {
  id: string;
  nome: string;
  valor: number;
  quantidade: number;
  ticketMedio: number;
};

export type LinhaProduto = {
  id: string;
  nome: string;
  quantidade: number;
  faturamento: number;
};

export interface RelatorioVendas {
  faturamento: number;
  vendasConcluidas: number;
  vendasCanceladas: number;
  quantidadeVendida: number;
  ticketMedio: number;
  vendasPorPeriodo: LinhaPeriodo[];
  vendasPorFormaPagamento: LinhaPagamento[];
  vendasPorCliente: LinhaCliente[];
  produtosMaisVendidos: LinhaProduto[];
}

export type LinhaFornecedor = {
  id: string;
  nome: string;
  valor: number;
  quantidade: number;
  pago: number;
  pendente: number;
};

export type LinhaProdutoCompra = {
  id: string;
  nome: string;
  quantidade: number;
  valor: number;
};

export interface RelatorioCompras {
  totalComprado: number;
  comprasConcluidas: number;
  comprasCanceladas: number;
  quantidadeCompras: number;
  fornecedores: LinhaFornecedor[];
  produtosComprados: LinhaProdutoCompra[];
  comprasPorPeriodo: LinhaPeriodo[];
  totalPago: number;
  totalPendente: number;
}

function arredondar(valor: number): number {
  return Math.round((Number(valor) || 0) * 100) / 100;
}

function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function fimDoDia(data: Date): Date {
  return new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate(),
    23,
    59,
    59,
    999,
  );
}

function converterData(data?: string): Date | null {
  if (!data) return null;

  // Datas YYYY-MM-DD são interpretadas no fuso local para evitar
  // deslocamento de um dia no relatório.
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    const [ano, mes, dia] = data.split("-").map(Number);
    const valor = new Date(ano, mes - 1, dia);
    return Number.isNaN(valor.getTime()) ? null : valor;
  }

  const valor = new Date(data);
  return Number.isNaN(valor.getTime()) ? null : valor;
}

function dentroDoPeriodo(data: string | undefined, periodo: PeriodoRelatorio) {
  const valor = converterData(data);
  if (!valor) return false;

  const inicio = periodo.inicio
    ? converterData(periodo.inicio)
    : null;

  const fim = periodo.fim ? converterData(periodo.fim) : null;

  if (inicio && inicioDoDia(valor) < inicioDoDia(inicio)) return false;
  if (fim && valor > fimDoDia(fim)) return false;

  return true;
}

function formatarMes(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function labelMes(periodo: string): string {
  const [ano, mes] = periodo.split("-").map(Number);
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  });
}

function ordenarDesc<T extends { valor: number }>(linhas: T[]): T[] {
  return linhas.sort((a, b) => b.valor - a.valor);
}

function formaPagamentoLabel(forma?: FormaPagamento): string {
  const labels: Record<string, string> = {
    pix: "PIX",
    dinheiro: "Dinheiro",
    cartao_credito: "Cartão de crédito",
    cartao_debito: "Cartão de débito",
    boleto: "Boleto",
    transferencia: "Transferência",
    outro: "Outro",
  };

  return labels[forma ?? ""] ?? "Não informado";
}

function totalItensVenda(venda: Venda): number {
  return venda.itens.reduce(
    (total, item) => total + (Number(item.quantidade) || 0),
    0,
  );
}

export function obterRelatorioVendas(
  periodo: PeriodoRelatorio = {},
): RelatorioVendas {
  const vendas = obterVendas().filter((venda) =>
    dentroDoPeriodo(venda.dataVenda, periodo),
  );

  const concluidas = vendas.filter((venda) => venda.status === "concluida");
  const canceladas = vendas.filter((venda) => venda.status === "cancelada");

  const faturamento = arredondar(
    concluidas.reduce((total, venda) => total + venda.total, 0),
  );

  const quantidadeVendida = concluidas.reduce(
    (total, venda) => total + totalItensVenda(venda),
    0,
  );

  const ticketMedio =
    concluidas.length > 0
      ? arredondar(faturamento / concluidas.length)
      : 0;

  const porPeriodo = new Map<string, LinhaPeriodo>();

  for (const venda of concluidas) {
    const data = converterData(venda.dataVenda);
    if (!data) continue;

    const chave = formatarMes(data);
    const atual = porPeriodo.get(chave) ?? {
      periodo: chave,
      label: labelMes(chave),
      valor: 0,
      quantidade: 0,
    };

    atual.valor = arredondar(atual.valor + venda.total);
    atual.quantidade += 1;
    porPeriodo.set(chave, atual);
  }

  const pagamentos = new Map<string, LinhaPagamento>();

  for (const venda of concluidas) {
    const forma = formaPagamentoLabel(venda.formaPagamento);
    const atual = pagamentos.get(forma) ?? {
      forma,
      valor: 0,
      quantidade: 0,
      percentual: 0,
    };

    atual.valor = arredondar(atual.valor + venda.total);
    atual.quantidade += 1;
    pagamentos.set(forma, atual);
  }

  const clientes = new Map<string, LinhaCliente>();

  for (const venda of concluidas) {
    const id = venda.clienteId || `cliente-${venda.clienteNome}`;
    const atual = clientes.get(id) ?? {
      id,
      nome: venda.clienteNome || "Cliente não informado",
      valor: 0,
      quantidade: 0,
      ticketMedio: 0,
    };

    atual.valor = arredondar(atual.valor + venda.total);
    atual.quantidade += 1;
    clientes.set(id, atual);
  }

  for (const linha of clientes.values()) {
    linha.ticketMedio =
      linha.quantidade > 0
        ? arredondar(linha.valor / linha.quantidade)
        : 0;
  }

  const produtos = new Map<string, LinhaProduto>();

  for (const venda of concluidas) {
    for (const item of venda.itens) {
      const id = item.produtoId || `produto-${item.produtoNome}`;
      const atual = produtos.get(id) ?? {
        id,
        nome: item.produtoNome || "Produto não informado",
        quantidade: 0,
        faturamento: 0,
      };

      atual.quantidade += Number(item.quantidade) || 0;
      atual.faturamento = arredondar(
        atual.faturamento + (Number(item.subtotal) || 0),
      );
      produtos.set(id, atual);
    }
  }

  const vendasPorFormaPagamento = ordenarDesc(
    [...pagamentos.values()].map((linha) => ({
      ...linha,
      percentual:
        faturamento > 0
          ? arredondar((linha.valor / faturamento) * 100)
          : 0,
    })),
  );

  return {
    faturamento,
    vendasConcluidas: concluidas.length,
    vendasCanceladas: canceladas.length,
    quantidadeVendida,
    ticketMedio,
    vendasPorPeriodo: [...porPeriodo.values()].sort((a, b) =>
      a.periodo.localeCompare(b.periodo),
    ),
    vendasPorFormaPagamento,
    vendasPorCliente: ordenarDesc([...clientes.values()]).slice(0, 20),
    produtosMaisVendidos: [...produtos.values()]
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 20),
  };
}

function totalCompraNaoCancelada(compra: Compra): number {
  return arredondar(compra.total);
}

export function obterRelatorioCompras(
  periodo: PeriodoRelatorio = {},
): RelatorioCompras {
  const compras = obterCompras().filter((compra) =>
    dentroDoPeriodo(compra.dataCompra, periodo),
  );

  const validas = compras.filter((compra) => compra.status !== "cancelada");
  const recebidas = compras.filter((compra) => compra.status === "recebida");
  const canceladas = compras.filter((compra) => compra.status === "cancelada");

  const totalComprado = arredondar(
    validas.reduce(
      (total, compra) => total + totalCompraNaoCancelada(compra),
      0,
    ),
  );

  const idsComprasValidas = new Set(validas.map((compra) => compra.id));

  const contas = listarContasPagar().filter(
    (conta) =>
      conta.status !== "cancelada" &&
      !!conta.compraId &&
      idsComprasValidas.has(conta.compraId),
  );

  const totalPago = arredondar(
    contas.reduce((total, conta) => total + conta.valorPago, 0),
  );

  const totalPendente = arredondar(
    contas.reduce((total, conta) => total + conta.saldo, 0),
  );

  const fornecedores = new Map<string, LinhaFornecedor>();

  for (const compra of validas) {
    const id = compra.fornecedorId || `fornecedor-${compra.fornecedorNome}`;
    const conta = contas.find((item) => item.compraId === compra.id);

    const atual = fornecedores.get(id) ?? {
      id,
      nome: compra.fornecedorNome || "Fornecedor não informado",
      valor: 0,
      quantidade: 0,
      pago: 0,
      pendente: 0,
    };

    atual.valor = arredondar(atual.valor + compra.total);
    atual.quantidade += 1;
    atual.pago = arredondar(atual.pago + (conta?.valorPago ?? 0));
    atual.pendente = arredondar(atual.pendente + (conta?.saldo ?? 0));
    fornecedores.set(id, atual);
  }

  const produtos = new Map<string, LinhaProdutoCompra>();

  for (const compra of validas) {
    for (const item of compra.itens) {
      const id =
        item.produtoId ||
        `produto-${item.produtoCodigo}-${item.produtoNome}`;

      const atual = produtos.get(id) ?? {
        id,
        nome: item.produtoNome || "Produto não informado",
        quantidade: 0,
        valor: 0,
      };

      atual.quantidade += Number(item.quantidade) || 0;
      atual.valor = arredondar(atual.valor + (Number(item.subtotal) || 0));
      produtos.set(id, atual);
    }
  }

  const porPeriodo = new Map<string, LinhaPeriodo>();

  for (const compra of validas) {
    const data = converterData(compra.dataCompra);
    if (!data) continue;

    const chave = formatarMes(data);
    const atual = porPeriodo.get(chave) ?? {
      periodo: chave,
      label: labelMes(chave),
      valor: 0,
      quantidade: 0,
    };

    atual.valor = arredondar(atual.valor + compra.total);
    atual.quantidade += 1;
    porPeriodo.set(chave, atual);
  }

  return {
    totalComprado,
    comprasConcluidas: recebidas.length,
    comprasCanceladas: canceladas.length,
    quantidadeCompras: validas.length,
    fornecedores: ordenarDesc([...fornecedores.values()]).slice(0, 20),
    produtosComprados: [...produtos.values()]
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 20),
    comprasPorPeriodo: [...porPeriodo.values()].sort((a, b) =>
      a.periodo.localeCompare(b.periodo),
    ),
    totalPago,
    totalPendente,
  };
}


/* ============================================================
   RELATÓRIO DE ESTOQUE
   ============================================================ */

export type LinhaMovimentacaoProduto = {
  produtoId: string;
  codigo: string;
  nome: string;
  entradas: number;
  saidas: number;
  ajustes: number;
  estornos: number;
  movimentacoes: number;
  saldoMovimentado: number;
};

export type LinhaMovimentacaoPeriodo = {
  periodo: string;
  label: string;
  entradas: number;
  saidas: number;
  ajustes: number;
  estornos: number;
  movimentacoes: number;
};

export type LinhaEstoqueBaixo = {
  id: number;
  codigo: string;
  nome: string;
  categoria: string;
  estoque: number;
  minimo: number;
};

export interface RelatorioEstoque {
  entradas: number;
  saidas: number;
  ajustes: number;
  estornos: number;
  totalMovimentacoes: number;
  produtosEstoqueBaixo: LinhaEstoqueBaixo[];
  movimentacaoPorProduto: LinhaMovimentacaoProduto[];
  movimentacaoPorPeriodo: LinhaMovimentacaoPeriodo[];
}

function quantidadeMovimentacao(
  movimentacao: MovimentacaoEstoque,
  tipo: TipoMovimentacao,
): number {
  return movimentacao.tipo === tipo
    ? arredondar(Math.abs(Number(movimentacao.quantidade) || 0))
    : 0;
}

function agruparMovimentacoesPorProduto(
  movimentacoes: MovimentacaoEstoque[],
): LinhaMovimentacaoProduto[] {
  const mapa = new Map<string, LinhaMovimentacaoProduto>();

  for (const item of movimentacoes) {
    const id = item.produtoId || item.produtoCodigo;
    const atual = mapa.get(id) ?? {
      produtoId: id,
      codigo: item.produtoCodigo,
      nome: item.produtoNome || "Produto não informado",
      entradas: 0,
      saidas: 0,
      ajustes: 0,
      estornos: 0,
      movimentacoes: 0,
      saldoMovimentado: 0,
    };

    atual.entradas = arredondar(
      atual.entradas + quantidadeMovimentacao(item, "entrada"),
    );
    atual.saidas = arredondar(
      atual.saidas + quantidadeMovimentacao(item, "saida"),
    );
    atual.ajustes = arredondar(
      atual.ajustes + quantidadeMovimentacao(item, "ajuste"),
    );
    atual.estornos = arredondar(
      atual.estornos + quantidadeMovimentacao(item, "estorno"),
    );
    atual.movimentacoes += 1;

    // O saldo movimentado representa a diferença líquida registrada
    // pelos tipos de movimentação. Estornos são tratados como inversão
    // apenas para leitura do relatório.
    atual.saldoMovimentado = arredondar(
      atual.entradas -
        atual.saidas +
        atual.ajustes -
        atual.estornos,
    );

    mapa.set(id, atual);
  }

  return [...mapa.values()].sort(
    (a, b) =>
      b.movimentacoes - a.movimentacoes ||
      b.entradas + b.saidas - (a.entradas + a.saidas),
  );
}

function agruparMovimentacoesPorPeriodo(
  movimentacoes: MovimentacaoEstoque[],
): LinhaMovimentacaoPeriodo[] {
  const mapa = new Map<string, LinhaMovimentacaoPeriodo>();

  for (const item of movimentacoes) {
    const data = converterData(item.data);
    if (!data) continue;

    const chave = formatarMes(data);
    const atual = mapa.get(chave) ?? {
      periodo: chave,
      label: labelMes(chave),
      entradas: 0,
      saidas: 0,
      ajustes: 0,
      estornos: 0,
      movimentacoes: 0,
    };

    atual.entradas = arredondar(
      atual.entradas + quantidadeMovimentacao(item, "entrada"),
    );
    atual.saidas = arredondar(
      atual.saidas + quantidadeMovimentacao(item, "saida"),
    );
    atual.ajustes = arredondar(
      atual.ajustes + quantidadeMovimentacao(item, "ajuste"),
    );
    atual.estornos = arredondar(
      atual.estornos + quantidadeMovimentacao(item, "estorno"),
    );
    atual.movimentacoes += 1;

    mapa.set(chave, atual);
  }

  return [...mapa.values()].sort((a, b) =>
    a.periodo.localeCompare(b.periodo),
  );
}

function obterEstoqueMinimo(produto: Produto): number {
  const candidato = Number(
    (produto as Produto & { estoqueMinimo?: number }).estoqueMinimo,
  );

  // O cadastro atual já possui estoqueMinimo. O fallback de 2 mantém
  // compatibilidade com produtos legados que ainda não tenham esse campo.
  return Number.isFinite(candidato) && candidato > 0 ? candidato : 2;
}

export function obterRelatorioEstoque(
  periodo: PeriodoRelatorio = {},
): RelatorioEstoque {
  const movimentacoes = obterMovimentacoes().filter((item) =>
    dentroDoPeriodo(item.data, periodo),
  );

  const entradas = arredondar(
    movimentacoes.reduce(
      (total, item) => total + quantidadeMovimentacao(item, "entrada"),
      0,
    ),
  );

  const saidas = arredondar(
    movimentacoes.reduce(
      (total, item) => total + quantidadeMovimentacao(item, "saida"),
      0,
    ),
  );

  const ajustes = arredondar(
    movimentacoes.reduce(
      (total, item) => total + quantidadeMovimentacao(item, "ajuste"),
      0,
    ),
  );

  const estornos = arredondar(
    movimentacoes.reduce(
      (total, item) => total + quantidadeMovimentacao(item, "estorno"),
      0,
    ),
  );

  const produtosEstoqueBaixo: LinhaEstoqueBaixo[] = obterProdutos()
    .map((produto) => ({
      id: produto.id,
      codigo: produto.codigo,
      nome: produto.nome,
      categoria: produto.categoria,
      estoque: Number(produto.estoque) || 0,
      minimo: obterEstoqueMinimo(produto),
    }))
    .filter((produto) => produto.minimo > 0 && produto.estoque <= produto.minimo)
    .sort((a, b) => a.estoque - b.estoque);

  return {
    entradas,
    saidas,
    ajustes,
    estornos,
    totalMovimentacoes: movimentacoes.length,
    produtosEstoqueBaixo,
    movimentacaoPorProduto: agruparMovimentacoesPorProduto(movimentacoes),
    movimentacaoPorPeriodo: agruparMovimentacoesPorPeriodo(movimentacoes),
  };
}

/* ============================================================
   RELATÓRIO FINANCEIRO
   ============================================================ */

export type LinhaFluxoFinanceiro = {
  periodo: string;
  label: string;
  entradas: number;
  saidas: number;
  resultado: number;
};

export interface RelatorioFinanceiro {
  entradas: number;
  saidas: number;
  saldo: number;

  contasRecebidas: number;
  contasPagas: number;

  quantidadeContasRecebidas: number;
  quantidadeContasPagas: number;

  contasEmAberto: number;
  contasVencidas: number;

  valorContasEmAberto: number;
  valorContasVencidas: number;

  fluxoDeCaixa: LinhaFluxoFinanceiro[];
}

export function obterRelatorioFinanceiro(
  periodo: PeriodoRelatorio = {},
): RelatorioFinanceiro {
  const lancamentos = listarLancamentosCaixa();

  const filtrados = lancamentos.filter((lancamento) =>
    dentroDoPeriodo(lancamento.data, periodo),
  );

  const entradas = arredondar(
    filtrados
      .filter((item) => item.tipo === "entrada")
      .reduce((total, item) => total + item.valor, 0),
  );

  const saidas = arredondar(
    filtrados
      .filter((item) => item.tipo === "saida")
      .reduce((total, item) => total + item.valor, 0),
  );

  const contasReceber = listarContasReceber();
  const contasPagar = listarContasPagar();

  const contasRecebidas = contasReceber.filter(
    (conta) =>
      conta.status === "recebida" &&
      dentroDoPeriodo(conta.atualizadoEm || conta.dataVencimento, periodo),
  );

  const contasPagas = contasPagar.filter(
    (conta) =>
      conta.status === "paga" &&
      dentroDoPeriodo(conta.atualizadoEm || conta.dataVencimento, periodo),
  );

  const contasReceberAbertas = contasReceber.filter(
    (conta) => conta.status !== "cancelada" && conta.saldo > 0,
  );

  const contasPagarAbertas = contasPagar.filter(
    (conta) => conta.status !== "cancelada" && conta.saldo > 0,
  );

  const contasVencidasReceber = contasReceber.filter(
    (conta) => conta.status === "vencida" && conta.saldo > 0,
  );

  const contasVencidasPagar = contasPagar.filter(
    (conta) => conta.status === "vencida" && conta.saldo > 0,
  );

  const fluxo = new Map<string, LinhaFluxoFinanceiro>();

  for (const lancamento of filtrados) {
    const data = converterData(lancamento.data);
    if (!data) continue;

    const chave = formatarMes(data);
    const atual = fluxo.get(chave) ?? {
      periodo: chave,
      label: labelMes(chave),
      entradas: 0,
      saidas: 0,
      resultado: 0,
    };

    if (lancamento.tipo === "entrada") {
      atual.entradas = arredondar(atual.entradas + lancamento.valor);
    } else {
      atual.saidas = arredondar(atual.saidas + lancamento.valor);
    }

    atual.resultado = arredondar(atual.entradas - atual.saidas);
    fluxo.set(chave, atual);
  }

  // Saldo atual é sempre o saldo real do Caixa, independentemente
  // do filtro de período. O fluxo respeita o período selecionado.
  const todosLancamentos = listarLancamentosCaixa();
  const saldo = arredondar(
    todosLancamentos.reduce(
      (total, item) =>
        total + (item.tipo === "entrada" ? item.valor : -item.valor),
      0,
    ),
  );

  return {
    entradas,
    saidas,
    saldo,

    contasRecebidas: arredondar(
      contasRecebidas.reduce((total, conta) => total + conta.valorRecebido, 0),
    ),
    contasPagas: arredondar(
      contasPagas.reduce((total, conta) => total + conta.valorPago, 0),
    ),

    quantidadeContasRecebidas: contasRecebidas.length,
    quantidadeContasPagas: contasPagas.length,

    contasEmAberto:
      contasReceberAbertas.length + contasPagarAbertas.length,

    contasVencidas:
      contasVencidasReceber.length + contasVencidasPagar.length,

    valorContasEmAberto: arredondar(
      contasReceberAbertas.reduce((total, conta) => total + conta.saldo, 0) +
        contasPagarAbertas.reduce((total, conta) => total + conta.saldo, 0),
    ),

    valorContasVencidas: arredondar(
      contasVencidasReceber.reduce((total, conta) => total + conta.saldo, 0) +
        contasVencidasPagar.reduce((total, conta) => total + conta.saldo, 0),
    ),

    fluxoDeCaixa: [...fluxo.values()].sort((a, b) =>
      a.periodo.localeCompare(b.periodo),
    ),
  };
}


/* ============================================================
   RELATÓRIO GERENCIAL
   ============================================================ */

export type LinhaGerencialPeriodo = {
  periodo: string;
  label: string;
  vendas: number;
  compras: number;
  entradas: number;
  saidas: number;
  resultado: number;
};

export interface RelatorioGerencial {
  faturamento: number;
  compras: number;
  entradas: number;
  saidas: number;
  resultado: number;

  vendasConcluidas: number;
  comprasConcluidas: number;
  vendasCanceladas: number;
  comprasCanceladas: number;

  vendasPorPeriodo: LinhaPeriodo[];
  comprasPorPeriodo: LinhaPeriodo[];
  fluxoFinanceiro: LinhaFluxoFinanceiro[];
  evolucaoPorPeriodo: LinhaGerencialPeriodo[];

  produtosMaisVendidos: LinhaProduto[];
  clientesQueMaisCompram: LinhaCliente[];
  fornecedoresMaiorVolume: LinhaFornecedor[];
}

export function obterRelatorioGerencial(
  periodo: PeriodoRelatorio = {},
): RelatorioGerencial {
  const vendas = obterRelatorioVendas(periodo);
  const compras = obterRelatorioCompras(periodo);
  const financeiro = obterRelatorioFinanceiro(periodo);

  const periodos = new Map<string, LinhaGerencialPeriodo>();

  const garantirPeriodo = (
    linha: LinhaPeriodo | LinhaFluxoFinanceiro,
  ): LinhaGerencialPeriodo => {
    const atual = periodos.get(linha.periodo) ?? {
      periodo: linha.periodo,
      label: linha.label,
      vendas: 0,
      compras: 0,
      entradas: 0,
      saidas: 0,
      resultado: 0,
    };

    periodos.set(linha.periodo, atual);
    return atual;
  };

  for (const linha of vendas.vendasPorPeriodo) {
    const atual = garantirPeriodo(linha);
    atual.vendas = arredondar(atual.vendas + linha.valor);
  }

  for (const linha of compras.comprasPorPeriodo) {
    const atual = garantirPeriodo(linha);
    atual.compras = arredondar(atual.compras + linha.valor);
  }

  for (const linha of financeiro.fluxoDeCaixa) {
    const atual = garantirPeriodo(linha);
    atual.entradas = arredondar(atual.entradas + linha.entradas);
    atual.saidas = arredondar(atual.saidas + linha.saidas);
  }

  for (const atual of periodos.values()) {
    atual.resultado = arredondar(atual.entradas - atual.saidas);
  }

  return {
    faturamento: vendas.faturamento,
    compras: compras.totalComprado,
    entradas: financeiro.entradas,
    saidas: financeiro.saidas,
    resultado: arredondar(financeiro.entradas - financeiro.saidas),

    vendasConcluidas: vendas.vendasConcluidas,
    comprasConcluidas: compras.comprasConcluidas,
    vendasCanceladas: vendas.vendasCanceladas,
    comprasCanceladas: compras.comprasCanceladas,

    vendasPorPeriodo: vendas.vendasPorPeriodo,
    comprasPorPeriodo: compras.comprasPorPeriodo,
    fluxoFinanceiro: financeiro.fluxoDeCaixa,
    evolucaoPorPeriodo: [...periodos.values()].sort((a, b) =>
      a.periodo.localeCompare(b.periodo),
    ),

    produtosMaisVendidos: vendas.produtosMaisVendidos.slice(0, 10),
    clientesQueMaisCompram: vendas.vendasPorCliente.slice(0, 10),
    fornecedoresMaiorVolume: compras.fornecedores.slice(0, 10),
  };
}
