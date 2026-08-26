/**
 * Análises gerenciais — ABR Agro
 * Store somente de leitura.
 */

import { obterVendas, type Venda } from "./vendasStore";
import { obterCompras } from "./comprasStore";
import { listarLancamentosCaixa } from "./caixaStore";
import { obterProdutos, type Produto } from "./produtosStore";
import { obterMovimentacoes } from "./movimentacoesStore";
import { listarContasPagar } from "./contasPagarStore";
import { listarContasReceber } from "./contasReceberStore";

export type PeriodoAnalise = { inicio?: string; fim?: string };

export type LinhaAnalisePeriodo = {
  periodo: string;
  label: string;
  faturamento: number;
  custo: number;
  lucroBruto: number;
  margem: number;
  vendas: number;
  entradas: number;
  saidas: number;
  resultado: number;
};

export type LinhaProdutoAnalise = {
  id: string;
  nome: string;
  quantidade: number;
  faturamento: number;
  custo: number;
  lucroBruto: number;
  margem: number;
  vendas: number;
  custoHistoricoCompleto: boolean;
};

export type LinhaClienteAnalise = {
  id: string;
  nome: string;
  vendas: number;
  faturamento: number;
  custo: number;
  lucroBruto: number;
  margem: number;
  ticketMedio: number;
  custoHistoricoCompleto: boolean;
};

export type LinhaFormaPagamentoAnalise = {
  forma: string;
  vendas: number;
  faturamento: number;
  percentual: number;
};

export type TipoAlertaAnalise =
  | "estoque-baixo"
  | "produto-parado"
  | "margem-baixa"
  | "cliente-baixa-margem"
  | "conta-pagar-vencida"
  | "conta-receber-vencida"
  | "fluxo-negativo"
  | "custos-em-alta"
  | "faturamento-em-queda";

export type SeveridadeAlertaAnalise = "critico" | "atencao" | "info";

export type AlertaAnalise = {
  id: string;
  tipo: TipoAlertaAnalise;
  severidade: SeveridadeAlertaAnalise;
  titulo: string;
  descricao: string;
  valor?: number;
  quantidade?: number;
};

export type LinhaFornecedorAnalise = {
  id: string;
  nome: string;
  compras: number;
  totalComprado: number;
  totalPago: number;
  saldoPendente: number;
  percentualCompras: number;
  ticketMedio: number;
};

export type ComparacaoPeriodoAnalise = {
  atual: {
    inicio?: string;
    fim?: string;
    faturamento: number;
    vendas: number;
    quantidadeVendida: number;
    ticketMedio: number;
    custoMercadorias: number;
    lucroBruto: number;
    margemBruta: number;
    compras: number;
    totalComprado: number;
    entradas: number;
    saidas: number;
    resultadoFinanceiro: number;
  };
  anterior: {
    inicio?: string;
    fim?: string;
    faturamento: number;
    vendas: number;
    quantidadeVendida: number;
    ticketMedio: number;
    custoMercadorias: number;
    lucroBruto: number;
    margemBruta: number;
    compras: number;
    totalComprado: number;
    entradas: number;
    saidas: number;
    resultadoFinanceiro: number;
  };
  variacao: {
    faturamento: number | null;
    vendas: number | null;
    quantidadeVendida: number | null;
    ticketMedio: number | null;
    custoMercadorias: number | null;
    lucroBruto: number | null;
    margemBrutaPp: number | null;
    compras: number | null;
    totalComprado: number | null;
    entradas: number | null;
    saidas: number | null;
    resultadoFinanceiro: number | null;
  };
};

export type LinhaEstoqueAnalise = {
  id: string;
  codigo: string;
  nome: string;
  categoria: string;
  estoque: number;
  estoqueMinimo: number;
  custoUnitario: number;
  valorEstoque: number;
  quantidadeVendida: number;
  valorVendido: number;
  giro: number;
  diasSemVenda: number | null;
  status: "giro-alto" | "giro-baixo" | "parado" | "baixo";
};

export interface AnaliseEstoque {
  valorInvestido: number;
  quantidadeProdutos: number;
  estoqueBaixo: LinhaEstoqueAnalise[];
  produtosParados: LinhaEstoqueAnalise[];
  maiorGiro: LinhaEstoqueAnalise[];
  menorGiro: LinhaEstoqueAnalise[];
  produtos: LinhaEstoqueAnalise[];
}

export interface AnaliseVendas {
  faturamento: number;
  vendasConcluidas: number;
  vendasCanceladas: number;
  quantidadeVendida: number;
  ticketMedio: number;
  custoMercadorias: number;
  lucroBruto: number;
  margemBruta: number;
  vendasSemCustoHistorico: number;
  itensSemCustoHistorico: number;
  crescimentoFaturamento: number | null;
  crescimentoLucroBruto: number | null;
  vendasPorPeriodo: LinhaAnalisePeriodo[];
  produtosMaisVendidos: LinhaProdutoAnalise[];
  produtosMaisFaturados: LinhaProdutoAnalise[];
  produtosMaisLucrativos: LinhaProdutoAnalise[];
  produtosMenorMargem: LinhaProdutoAnalise[];
  clientesMaisCompram: LinhaClienteAnalise[];
  vendasPorFormaPagamento: LinhaFormaPagamentoAnalise[];
}

export interface AnaliseFinanceira {
  entradas: number;
  saidas: number;
  resultado: number;
  saldoAtual: number;
  fluxoPorPeriodo: LinhaAnalisePeriodo[];
}

export interface AnaliseCompras {
  totalComprado: number;
  comprasConcluidas: number;
  comprasCanceladas: number;
  quantidadeCompras: number;
  ticketMedio: number;
}

export interface AnaliseGerencial {
  vendas: AnaliseVendas;
  financeiro: AnaliseFinanceira;
  compras: AnaliseCompras;
  faturamento: number;
  custoMercadorias: number;
  lucroBruto: number;
  margemBruta: number;
  entradas: number;
  saidas: number;
  resultadoFinanceiro: number;
  crescimentoFaturamento: number | null;
  crescimentoLucroBruto: number | null;
  vendasPorPeriodo: LinhaAnalisePeriodo[];
  produtosMaisVendidos: LinhaProdutoAnalise[];
  produtosMaisFaturados: LinhaProdutoAnalise[];
  produtosMaisLucrativos: LinhaProdutoAnalise[];
  clientesMaisCompram: LinhaClienteAnalise[];
  clientesMaisLucrativos: LinhaClienteAnalise[];
  clientesMenorMargem: LinhaClienteAnalise[];
  fornecedoresMaisComprados: LinhaFornecedorAnalise[];
  fornecedoresMaisPagos: LinhaFornecedorAnalise[];
  comparacaoPeriodos: ComparacaoPeriodoAnalise | null;
  alertas: AlertaAnalise[];
  estoque: AnaliseEstoque;
}

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const r = (v: number) => Math.round(n(v) * 100) / 100;

function moedaNumero(v: unknown): number {
  if (typeof v === "number") {
    return Number.isFinite(v) ? v : 0;
  }

  const texto = String(v ?? "").trim();

  if (!texto) {
    return 0;
  }

  const normalizado = texto
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const valor = Number(normalizado);

  return Number.isFinite(valor) ? valor : 0;
}

function data(v?: string): Date | null {
  if (!v) return null;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v)
    ? (() => {
        const [y, m, day] = v.split("-").map(Number);
        return new Date(y, m - 1, day);
      })()
    : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function dentro(v: string | undefined, p: PeriodoAnalise) {
  const d = data(v);
  if (!d) return false;
  if (p.inicio) {
    const x = data(p.inicio);
    if (x && d < new Date(x.getFullYear(), x.getMonth(), x.getDate()))
      return false;
  }
  if (p.fim) {
    const x = data(p.fim);
    if (
      x &&
      d > new Date(x.getFullYear(), x.getMonth(), x.getDate(), 23, 59, 59, 999)
    )
      return false;
  }
  return true;
}
function mes(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function label(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  });
}
function margem(f: number, l: number) {
  return f > 0 ? r((l / f) * 100) : 0;
}
function crescimento(a: number, b: number): number | null {
  return b === 0 ? (a === 0 ? 0 : null) : r(((a - b) / Math.abs(b)) * 100);
}
function custoItem(item: Venda["itens"][number]): number | null {
  const c = Number(item.custoUnitario);
  return Number.isFinite(c) && c >= 0 ? c : null;
}

function vendasBase(periodo: PeriodoAnalise) {
  return obterVendas().filter(
    (v) => dentro(v.dataVenda, periodo) && v.status === "concluida",
  );
}

function resumoVendas(periodo: PeriodoAnalise) {
  const vendas = vendasBase(periodo);
  let faturamento = 0,
    custo = 0,
    qtd = 0,
    semV = 0,
    semI = 0;
  const produtos = new Map<string, LinhaProdutoAnalise>(),
    clientes = new Map<string, LinhaClienteAnalise>();
  const pagamentos = new Map<string, LinhaFormaPagamentoAnalise>(),
    periodos = new Map<string, LinhaAnalisePeriodo>();
  for (const v of vendas) {
    faturamento += n(v.total);
    let incompleta = false;
    const d = data(v.dataVenda);
    const k = d ? mes(d) : null;
    if (k) {
      const x = periodos.get(k) || {
        periodo: k,
        label: label(k),
        faturamento: 0,
        custo: 0,
        lucroBruto: 0,
        margem: 0,
        vendas: 0,
        entradas: 0,
        saidas: 0,
        resultado: 0,
      };
      x.faturamento = r(x.faturamento + n(v.total));
      x.vendas++;
      periodos.set(k, x);
    }
    const cid =
      v.clienteId || `cliente-${v.clienteNome || "sem-identificacao"}`;
    const cli = clientes.get(cid) || {
      id: cid,
      nome: v.clienteNome || "Cliente não informado",
      vendas: 0,
      faturamento: 0,
      custo: 0,
      lucroBruto: 0,
      margem: 0,
      ticketMedio: 0,
      custoHistoricoCompleto: true,
    };
    cli.vendas++;
    cli.faturamento = r(cli.faturamento + n(v.total));
    for (const i of v.itens) {
      const q = n(i.quantidade),
        rec = n(i.subtotal),
        c = custoItem(i),
        ci = c === null ? 0 : r(q * c);
      qtd += q;
      if (c === null) {
        incompleta = true;
        semI++;
      } else custo += ci;
      const pid = i.produtoId || `produto-${i.produtoNome}`;
      const pr = produtos.get(pid) || {
        id: pid,
        nome: i.produtoNome || "Produto não informado",
        quantidade: 0,
        faturamento: 0,
        custo: 0,
        lucroBruto: 0,
        margem: 0,
        vendas: 0,
        custoHistoricoCompleto: true,
      };
      pr.quantidade += q;
      pr.faturamento = r(pr.faturamento + rec);
      pr.custo = r(pr.custo + ci);
      pr.lucroBruto = r(pr.lucroBruto + rec - ci);
      pr.vendas++;
      pr.custoHistoricoCompleto = pr.custoHistoricoCompleto && c !== null;
      produtos.set(pid, pr);
      if (c === null) cli.custoHistoricoCompleto = false;
      else {
        cli.custo = r(cli.custo + ci);
        cli.lucroBruto = r(cli.lucroBruto + rec - ci);
      }
      if (k) {
        const x = periodos.get(k)!;
        x.custo = r(x.custo + ci);
        x.lucroBruto = r(x.lucroBruto + rec - ci);
        periodos.set(k, x);
      }
    }
    if (incompleta) semV++;
    cli.margem = margem(cli.faturamento, cli.lucroBruto);
    cli.ticketMedio = r(cli.faturamento / cli.vendas);
    clientes.set(cid, cli);
    const f = v.formaPagamento || "nao_informado";
    const pg = pagamentos.get(f) || {
      forma: f,
      vendas: 0,
      faturamento: 0,
      percentual: 0,
    };
    pg.vendas++;
    pg.faturamento = r(pg.faturamento + n(v.total));
    pagamentos.set(f, pg);
  }
  const produtosArr = [...produtos.values()].map((x) => ({
    ...x,
    margem: margem(x.faturamento, x.lucroBruto),
  }));
  const clientesArr = [...clientes.values()];
  const fat = r(faturamento),
    lu = r(fat - custo);
  for (const x of periodos.values()) {
    x.faturamento = r(x.faturamento);
    x.custo = r(x.custo);
    x.lucroBruto = r(x.lucroBruto);
    x.margem = margem(x.faturamento, x.lucroBruto);
    x.resultado = x.lucroBruto;
  }
  for (const x of pagamentos.values())
    x.percentual = fat > 0 ? r((x.faturamento / fat) * 100) : 0;
  const sort = (a: any, b: any) => b - a;
  return {
    vendas,
    faturamento: fat,
    custoMercadorias: r(custo),
    lucroBruto: lu,
    quantidadeVendida: r(qtd),
    vendasSemCustoHistorico: semV,
    itensSemCustoHistorico: semI,
    produtos: produtosArr,
    clientes: clientesArr,
    pagamentos: [...pagamentos.values()],
    periodos: [...periodos.values()].sort((a, b) =>
      a.periodo.localeCompare(b.periodo),
    ),
  };
}

function periodoAnterior(p: PeriodoAnalise): PeriodoAnalise | null {
  if (!p.inicio || !p.fim) return null;
  const a = data(p.inicio),
    b = data(p.fim);
  if (!a || !b || b < a) return null;
  const dur = b.getTime() - a.getTime() + 86400000,
    fim = new Date(a.getTime() - 1),
    ini = new Date(a.getTime() - dur);
  return { inicio: ini.toISOString(), fim: fim.toISOString() };
}

export function obterAnaliseVendas(
  periodo: PeriodoAnalise = {},
): AnaliseVendas {
  const x = resumoVendas(periodo),
    ant = periodoAnterior(periodo),
    prev = ant ? resumoVendas(ant) : null;
  return {
    faturamento: x.faturamento,
    vendasConcluidas: x.vendas.length,
    vendasCanceladas: obterVendas().filter(
      (v) => dentro(v.dataVenda, periodo) && v.status === "cancelada",
    ).length,
    quantidadeVendida: x.quantidadeVendida,
    ticketMedio: x.vendas.length ? r(x.faturamento / x.vendas.length) : 0,
    custoMercadorias: x.custoMercadorias,
    lucroBruto: x.lucroBruto,
    margemBruta: margem(x.faturamento, x.lucroBruto),
    vendasSemCustoHistorico: x.vendasSemCustoHistorico,
    itensSemCustoHistorico: x.itensSemCustoHistorico,
    crescimentoFaturamento: prev
      ? crescimento(x.faturamento, prev.faturamento)
      : null,
    crescimentoLucroBruto: prev
      ? crescimento(x.lucroBruto, prev.lucroBruto)
      : null,
    vendasPorPeriodo: x.periodos,
    produtosMaisVendidos: [...x.produtos]
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 20),
    produtosMaisFaturados: [...x.produtos]
      .sort((a, b) => b.faturamento - a.faturamento)
      .slice(0, 20),
    produtosMaisLucrativos: x.produtos
      .filter((p) => p.custoHistoricoCompleto)
      .sort((a, b) => b.lucroBruto - a.lucroBruto)
      .slice(0, 20),
    produtosMenorMargem: x.produtos
      .filter((p) => p.custoHistoricoCompleto && p.faturamento > 0)
      .sort((a, b) => a.margem - b.margem)
      .slice(0, 20),
    clientesMaisCompram: [...x.clientes]
      .sort((a, b) => b.faturamento - a.faturamento)
      .slice(0, 20),
    vendasPorFormaPagamento: [...x.pagamentos].sort(
      (a, b) => b.faturamento - a.faturamento,
    ),
  };
}

export function obterAnaliseFinanceira(
  periodo: PeriodoAnalise = {},
): AnaliseFinanceira {
  const all = listarLancamentosCaixa(),
    ls = all.filter((l) => dentro(l.data, periodo));
  let entradas = 0,
    saidas = 0;
  const map = new Map<string, LinhaAnalisePeriodo>();
  for (const l of ls) {
    const d = data(l.data);
    if (!d) continue;
    const k = mes(d);
    const x = map.get(k) || {
      periodo: k,
      label: label(k),
      faturamento: 0,
      custo: 0,
      lucroBruto: 0,
      margem: 0,
      vendas: 0,
      entradas: 0,
      saidas: 0,
      resultado: 0,
    };
    if (l.tipo === "entrada")
      ((x.entradas = r(x.entradas + n(l.valor))), (entradas += n(l.valor)));
    else ((x.saidas = r(x.saidas + n(l.valor))), (saidas += n(l.valor)));
    x.resultado = r(x.entradas - x.saidas);
    map.set(k, x);
  }
  const saldo = r(
    all.reduce(
      (s, l) => s + (l.tipo === "entrada" ? n(l.valor) : -n(l.valor)),
      0,
    ),
  );
  return {
    entradas: r(entradas),
    saidas: r(saidas),
    resultado: r(entradas - saidas),
    saldoAtual: saldo,
    fluxoPorPeriodo: [...map.values()].sort((a, b) =>
      a.periodo.localeCompare(b.periodo),
    ),
  };
}

export function obterAnaliseCompras(
  periodo: PeriodoAnalise = {},
): AnaliseCompras {
  const cs = obterCompras().filter((c) => dentro(c.dataCompra, periodo)),
    validas = cs.filter((c) => c.status !== "cancelada"),
    total = r(validas.reduce((s, c) => s + n(c.total), 0));
  return {
    totalComprado: total,
    comprasConcluidas: cs.filter((c) => c.status === "recebida").length,
    comprasCanceladas: cs.filter((c) => c.status === "cancelada").length,
    quantidadeCompras: validas.length,
    ticketMedio: validas.length ? r(total / validas.length) : 0,
  };
}

/* =========================================================
   ANÁLISE DE ESTOQUE
   ========================================================= */

function obterAnaliseEstoque(periodo: PeriodoAnalise = {}): AnaliseEstoque {
  const produtos = obterProdutos();
  const movimentacoes = obterMovimentacoes();

  /*
   * Quantidade vendida e faturamento são obtidos das vendas
   * concluídas dentro do período selecionado.
   *
   * O estoque atual vem do cadastro real do produto.
   */
  const vendas = vendasBase(periodo);

  const vendasPorProduto = new Map<
    string,
    { quantidade: number; valor: number }
  >();

  for (const venda of vendas) {
    for (const item of venda.itens) {
      const id = String(item.produtoId);

      const atual = vendasPorProduto.get(id) ?? {
        quantidade: 0,
        valor: 0,
      };

      atual.quantidade += n(item.quantidade);
      atual.valor = r(atual.valor + n(item.subtotal));

      vendasPorProduto.set(id, atual);
    }
  }

  /*
   * Última saída/venda por produto, usada para identificar
   * produtos sem venda no período.
   */
  const ultimaVendaPorProduto = new Map<string, Date>();

  for (const venda of obterVendas().filter(
    (item) => item.status === "concluida",
  )) {
    const dataVenda = data(venda.dataVenda);

    if (!dataVenda) {
      continue;
    }

    for (const item of venda.itens) {
      const id = String(item.produtoId);
      const anterior = ultimaVendaPorProduto.get(id);

      if (!anterior || dataVenda > anterior) {
        ultimaVendaPorProduto.set(id, dataVenda);
      }
    }
  }

  /*
   * Converte o produto real em uma linha analítica.
   *
   * Giro operacional:
   * quantidade vendida no período / estoque atual.
   *
   * Quando não há estoque atual, utilizamos 0 para evitar
   * divisão por zero.
   */
  const linhas: LinhaEstoqueAnalise[] = produtos.map((produto: Produto) => {
    const id = String(produto.id);
    const venda = vendasPorProduto.get(id) ?? {
      quantidade: 0,
      valor: 0,
    };

    const estoque = n(produto.estoque);
    const estoqueMinimo = n(produto.estoqueMinimo ?? 2);
    const custoUnitario = moedaNumero(produto.custo);
    const valorEstoque = r(estoque * custoUnitario);

    const giro =
      estoque > 0
        ? r(venda.quantidade / estoque)
        : venda.quantidade > 0
          ? venda.quantidade
          : 0;

    const ultimaVenda = ultimaVendaPorProduto.get(id);

    const diasSemVenda = ultimaVenda
      ? Math.max(0, Math.floor((Date.now() - ultimaVenda.getTime()) / 86400000))
      : null;

    let status: LinhaEstoqueAnalise["status"];

    if (estoque <= 0 || estoque <= estoqueMinimo) {
      status = "baixo";
    } else if (venda.quantidade <= 0) {
      status = "parado";
    } else if (giro >= 1) {
      status = "giro-alto";
    } else {
      status = "giro-baixo";
    }

    return {
      id,
      codigo: produto.codigo,
      nome: produto.nome,
      categoria: produto.categoria,
      estoque,
      estoqueMinimo,
      custoUnitario,
      valorEstoque,
      quantidadeVendida: r(venda.quantidade),
      valorVendido: r(venda.valor),
      giro,
      diasSemVenda,
      status,
    };
  });

  const valorInvestido = r(
    linhas.reduce((total, produto) => total + produto.valorEstoque, 0),
  );

  /*
   * "Produtos parados" significa sem nenhuma venda no período
   * selecionado e com estoque disponível.
   */
  const produtosParados = linhas
    .filter((produto) => produto.estoque > 0 && produto.quantidadeVendida <= 0)
    .sort((a, b) => b.valorEstoque - a.valorEstoque);

  const estoqueBaixo = linhas
    .filter((produto) => produto.estoque <= produto.estoqueMinimo)
    .sort((a, b) => a.estoque - b.estoque);

  const comMovimento = linhas.filter(
    (produto) => produto.quantidadeVendida > 0,
  );

  const maiorGiro = [...comMovimento]
    .sort((a, b) => {
      if (b.giro !== a.giro) {
        return b.giro - a.giro;
      }

      return b.quantidadeVendida - a.quantidadeVendida;
    })
    .slice(0, 20);

  const menorGiro = [...comMovimento]
    .sort((a, b) => {
      if (a.giro !== b.giro) {
        return a.giro - b.giro;
      }

      return a.quantidadeVendida - b.quantidadeVendida;
    })
    .slice(0, 20);

  /*
   * O relatório mantém a lista completa de produtos para permitir
   * filtros/rankings futuros sem precisar alterar a regra de dados.
   *
   * A variável movimentacoes é lida aqui para validar que o Store
   * continua conectado ao histórico operacional; os rankings de
   * vendas usam as vendas concluídas, enquanto os dados de estoque
   * usam o cadastro atual.
   */
  void movimentacoes;

  return {
    valorInvestido,
    quantidadeProdutos: linhas.length,
    estoqueBaixo,
    produtosParados,
    maiorGiro,
    menorGiro,
    produtos: linhas,
  };
}

/* =========================================================
   CLIENTES, FORNECEDORES E COMPARAÇÃO DE PERÍODOS
   ========================================================= */

function obterAnaliseFornecedores(
  periodo: PeriodoAnalise,
): LinhaFornecedorAnalise[] {
  const compras = obterCompras().filter(
    (compra) =>
      dentro(compra.dataCompra, periodo) && compra.status !== "cancelada",
  );

  const contas = listarContasPagar();

  const mapa = new Map<string, LinhaFornecedorAnalise>();

  for (const compra of compras) {
    const id = String(
      compra.fornecedorId || `fornecedor-${compra.fornecedorNome}`,
    );

    const atual = mapa.get(id) ?? {
      id,
      nome: compra.fornecedorNome || "Fornecedor não informado",
      compras: 0,
      totalComprado: 0,
      totalPago: 0,
      saldoPendente: 0,
      percentualCompras: 0,
      ticketMedio: 0,
    };

    atual.compras += 1;
    atual.totalComprado = r(atual.totalComprado + n(compra.total));

    mapa.set(id, atual);
  }

  /*
   * O pagamento é obtido da Conta a Pagar correspondente à compra.
   * Isso evita considerar no fornecedor um pagamento de outra compra.
   */
  for (const conta of contas) {
    if (conta.status === "cancelada") {
      continue;
    }

    const compra = compras.find((item) => item.id === conta.compraId);

    if (!compra) {
      continue;
    }

    const id = String(
      conta.fornecedorId ||
        compra.fornecedorId ||
        `fornecedor-${conta.fornecedorNome}`,
    );

    const atual = mapa.get(id);

    if (!atual) {
      continue;
    }

    atual.totalPago = r(atual.totalPago + n(conta.valorPago));

    atual.saldoPendente = r(atual.saldoPendente + n(conta.saldo));
  }

  const totalComprado = [...mapa.values()].reduce(
    (total, fornecedor) => total + fornecedor.totalComprado,
    0,
  );

  for (const fornecedor of mapa.values()) {
    fornecedor.ticketMedio =
      fornecedor.compras > 0
        ? r(fornecedor.totalComprado / fornecedor.compras)
        : 0;

    fornecedor.percentualCompras =
      totalComprado > 0
        ? r((fornecedor.totalComprado / totalComprado) * 100)
        : 0;
  }

  return [...mapa.values()];
}

function obterResumoPeriodoCompleto(periodo: PeriodoAnalise) {
  const vendas = obterAnaliseVendas(periodo);
  const financeiro = obterAnaliseFinanceira(periodo);
  const compras = obterAnaliseCompras(periodo);

  return {
    inicio: periodo.inicio,
    fim: periodo.fim,

    faturamento: vendas.faturamento,
    vendas: vendas.vendasConcluidas,
    quantidadeVendida: vendas.quantidadeVendida,
    ticketMedio: vendas.ticketMedio,
    custoMercadorias: vendas.custoMercadorias,
    lucroBruto: vendas.lucroBruto,
    margemBruta: vendas.margemBruta,

    compras: compras.quantidadeCompras,
    totalComprado: compras.totalComprado,

    entradas: financeiro.entradas,
    saidas: financeiro.saidas,
    resultadoFinanceiro: financeiro.resultado,
  };
}

function obterComparacaoPeriodos(
  periodo: PeriodoAnalise,
): ComparacaoPeriodoAnalise | null {
  const anterior = periodoAnterior(periodo);

  if (!anterior) {
    return null;
  }

  const atual = obterResumoPeriodoCompleto(periodo);
  const previo = obterResumoPeriodoCompleto(anterior);

  return {
    atual,
    anterior: previo,

    variacao: {
      faturamento: crescimento(atual.faturamento, previo.faturamento),
      vendas: crescimento(atual.vendas, previo.vendas),
      quantidadeVendida: crescimento(
        atual.quantidadeVendida,
        previo.quantidadeVendida,
      ),
      ticketMedio: crescimento(atual.ticketMedio, previo.ticketMedio),
      custoMercadorias: crescimento(
        atual.custoMercadorias,
        previo.custoMercadorias,
      ),
      lucroBruto: crescimento(atual.lucroBruto, previo.lucroBruto),
      /*
       * Margem é uma diferença em pontos percentuais,
       * não uma variação percentual.
       */
      margemBrutaPp:
        atual.faturamento > 0 && previo.faturamento > 0
          ? r(atual.margemBruta - previo.margemBruta)
          : null,
      compras: crescimento(atual.compras, previo.compras),
      totalComprado: crescimento(atual.totalComprado, previo.totalComprado),
      entradas: crescimento(atual.entradas, previo.entradas),
      saidas: crescimento(atual.saidas, previo.saidas),
      resultadoFinanceiro: crescimento(
        atual.resultadoFinanceiro,
        previo.resultadoFinanceiro,
      ),
    },
  };
}

function gerarAlertasGerenciais(
  vendas: AnaliseVendas,
  financeiro: AnaliseFinanceira,
  estoque: AnaliseEstoque,
  comparacao: ComparacaoPeriodoAnalise | null,
  clientesMenorMargem: LinhaClienteAnalise[],
): AlertaAnalise[] {
  const alertas: AlertaAnalise[] = [];

  if (estoque.estoqueBaixo.length > 0) {
    const estoqueCritico = estoque.estoqueBaixo.some(
      (produto) => produto.estoque <= 0,
    );

    alertas.push({
      id: "estoque-baixo",
      tipo: "estoque-baixo",
      severidade: estoqueCritico ? "critico" : "atencao",
      titulo: "Estoque abaixo do mínimo",
      descricao: `${estoque.estoqueBaixo.length} produto(s) estão no mínimo ou abaixo dele.`,
      quantidade: estoque.estoqueBaixo.length,
    });
  }

  const valorParado = r(
    estoque.produtosParados.reduce(
      (total, produto) => total + produto.valorEstoque,
      0,
    ),
  );

  if (estoque.produtosParados.length > 0) {
    alertas.push({
      id: "produtos-parados",
      tipo: "produto-parado",
      severidade: "atencao",
      titulo: "Produtos parados",
      descricao: `${estoque.produtosParados.length} produto(s) possuem estoque, mas não tiveram vendas no período.`,
      valor: valorParado,
      quantidade: estoque.produtosParados.length,
    });
  }

  const produtosBaixaMargem = vendas.produtosMenorMargem.filter(
    (produto) => produto.margem < 15,
  );

  if (produtosBaixaMargem.length > 0) {
    const menor = produtosBaixaMargem[0];

    alertas.push({
      id: "margem-baixa-produtos",
      tipo: "margem-baixa",
      severidade: produtosBaixaMargem.some((produto) => produto.margem < 0)
        ? "critico"
        : "atencao",
      titulo: "Produtos com margem baixa",
      descricao:
        `${produtosBaixaMargem.length} produto(s) estão com margem abaixo de 15%. ` +
        (menor
          ? `Menor margem: ${menor.nome} (${menor.margem.toFixed(1).replace(".", ",")}%).`
          : ""),
      valor: menor?.margem,
      quantidade: produtosBaixaMargem.length,
    });
  }

  const clientesBaixaMargem = clientesMenorMargem.filter(
    (cliente) => cliente.margem < 10,
  );

  if (clientesBaixaMargem.length > 0) {
    const cliente = clientesBaixaMargem[0];

    alertas.push({
      id: "clientes-baixa-margem",
      tipo: "cliente-baixa-margem",
      severidade: clientesBaixaMargem.some((item) => item.margem < 0)
        ? "critico"
        : "atencao",
      titulo: "Clientes com baixa margem",
      descricao:
        `${clientesBaixaMargem.length} cliente(s) estão com margem abaixo de 10%. ` +
        (cliente
          ? `${cliente.nome} apresenta ${cliente.margem.toFixed(1).replace(".", ",")}% de margem.`
          : ""),
      valor: cliente?.margem,
      quantidade: clientesBaixaMargem.length,
    });
  }

  const vencidasPagar = listarContasPagar().filter(
    (conta) => conta.status === "vencida",
  );

  const valorVencidoPagar = r(
    vencidasPagar.reduce((total, conta) => total + n(conta.saldo), 0),
  );

  if (vencidasPagar.length > 0) {
    alertas.push({
      id: "contas-pagar-vencidas",
      tipo: "conta-pagar-vencida",
      severidade: "critico",
      titulo: "Contas a pagar vencidas",
      descricao: `${vencidasPagar.length} conta(s) estão vencidas e possuem saldo em aberto.`,
      valor: valorVencidoPagar,
      quantidade: vencidasPagar.length,
    });
  }

  const vencidasReceber = listarContasReceber().filter(
    (conta) => conta.status === "vencida",
  );

  const valorVencidoReceber = r(
    vencidasReceber.reduce((total, conta) => total + n(conta.saldo), 0),
  );

  if (vencidasReceber.length > 0) {
    alertas.push({
      id: "contas-receber-vencidas",
      tipo: "conta-receber-vencida",
      severidade: "critico",
      titulo: "Contas a receber vencidas",
      descricao: `${vencidasReceber.length} conta(s) estão vencidas e ainda possuem saldo a receber.`,
      valor: valorVencidoReceber,
      quantidade: vencidasReceber.length,
    });
  }

  if (financeiro.resultado < 0) {
    alertas.push({
      id: "fluxo-negativo",
      tipo: "fluxo-negativo",
      severidade: "critico",
      titulo: "Fluxo financeiro negativo",
      descricao: "As saídas superaram as entradas no período selecionado.",
      valor: financeiro.resultado,
    });
  }

  if (comparacao) {
    const crescimentoCusto = comparacao.variacao.custoMercadorias;
    const crescimentoFaturamento = comparacao.variacao.faturamento;

    if (
      crescimentoCusto !== null &&
      crescimentoFaturamento !== null &&
      crescimentoCusto > crescimentoFaturamento &&
      crescimentoCusto > 0
    ) {
      alertas.push({
        id: "custos-em-alta",
        tipo: "custos-em-alta",
        severidade: "atencao",
        titulo: "Custos crescendo acima do faturamento",
        descricao:
          `Custos cresceram ${crescimentoCusto.toFixed(1).replace(".", ",")}% ` +
          `contra ${crescimentoFaturamento.toFixed(1).replace(".", ",")}% do faturamento.`,
        valor: crescimentoCusto - crescimentoFaturamento,
      });
    }

    if (crescimentoFaturamento !== null && crescimentoFaturamento < 0) {
      alertas.push({
        id: "faturamento-em-queda",
        tipo: "faturamento-em-queda",
        severidade: crescimentoFaturamento <= -20 ? "critico" : "atencao",
        titulo: "Faturamento em queda",
        descricao: `O faturamento caiu ${Math.abs(crescimentoFaturamento)
          .toFixed(1)
          .replace(".", ",")}% em relação ao período anterior.`,
        valor: crescimentoFaturamento,
      });
    }
  }

  const peso: Record<SeveridadeAlertaAnalise, number> = {
    critico: 0,
    atencao: 1,
    info: 2,
  };

  return alertas.sort((a, b) => peso[a.severidade] - peso[b.severidade]);
}

export function obterAnaliseGerencial(
  periodo: PeriodoAnalise = {},
): AnaliseGerencial {
  const vendas = obterAnaliseVendas(periodo);
  const financeiro = obterAnaliseFinanceira(periodo);
  const compras = obterAnaliseCompras(periodo);
  const estoque = obterAnaliseEstoque(periodo);

  const clientesMaisLucrativos = [...vendas.clientesMaisCompram]
    .filter((cliente) => cliente.custoHistoricoCompleto)
    .sort((a, b) => b.lucroBruto - a.lucroBruto)
    .slice(0, 20);

  const clientesMenorMargem = [...vendas.clientesMaisCompram]
    .filter(
      (cliente) => cliente.custoHistoricoCompleto && cliente.faturamento > 0,
    )
    .sort((a, b) => a.margem - b.margem)
    .slice(0, 20);

  const fornecedores = obterAnaliseFornecedores(periodo);

  const fornecedoresMaisComprados = [...fornecedores]
    .sort((a, b) => b.totalComprado - a.totalComprado)
    .slice(0, 20);

  const fornecedoresMaisPagos = [...fornecedores]
    .sort((a, b) => b.totalPago - a.totalPago)
    .slice(0, 20);

  const comparacaoPeriodos = obterComparacaoPeriodos(periodo);

  const alertas = gerarAlertasGerenciais(
    vendas,
    financeiro,
    estoque,
    comparacaoPeriodos,
    clientesMenorMargem,
  );

  return {
    vendas,
    financeiro,
    compras,

    faturamento: vendas.faturamento,
    custoMercadorias: vendas.custoMercadorias,
    lucroBruto: vendas.lucroBruto,
    margemBruta: vendas.margemBruta,

    entradas: financeiro.entradas,
    saidas: financeiro.saidas,
    resultadoFinanceiro: financeiro.resultado,

    crescimentoFaturamento: vendas.crescimentoFaturamento,

    crescimentoLucroBruto: vendas.crescimentoLucroBruto,

    vendasPorPeriodo: vendas.vendasPorPeriodo,
    produtosMaisVendidos: vendas.produtosMaisVendidos,
    produtosMaisFaturados: vendas.produtosMaisFaturados,
    produtosMaisLucrativos: vendas.produtosMaisLucrativos,
    clientesMaisCompram: vendas.clientesMaisCompram,

    clientesMaisLucrativos,
    clientesMenorMargem,

    fornecedoresMaisComprados,
    fornecedoresMaisPagos,

    comparacaoPeriodos,
    alertas,

    estoque,
  };
}

export function obterFormaPagamentoLabel(forma?: string): string {
  const labels: Record<string, string> = {
    pix: "PIX",
    dinheiro: "Dinheiro",
    cartao_credito: "Cartão de crédito",
    cartao_debito: "Cartão de débito",
    boleto: "Boleto",
    transferencia: "Transferência",
    outro: "Outro",
  };
  return labels[forma || ""] || forma || "Não informado";
}
