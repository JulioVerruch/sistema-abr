/**
 * Visão consolidada do Financeiro - ABR Agro.
 *
 * Este arquivo NÃO cria uma segunda regra financeira.
 * Ele apenas consolida os dados já mantidos pelos Stores de:
 * - Caixa
 * - Contas a Receber
 * - Contas a Pagar
 *
 * As regras de criação, recebimento, pagamento, cancelamento e estorno
 * continuam nos respectivos Stores.
 */

import {
  atualizarStatusContasReceber,
  type ContaReceber,
} from "./contasReceberStore";
import {
  atualizarContasPagarVencidas,
  type ContaPagar,
} from "./contasPagarStore";
import {
  listarLancamentosCaixa,
  obterResumoCaixa,
  type LancamentoCaixa,
} from "./caixaStore";

export interface ItemFinanceiroPendente {
  id: string;
  origemId: string;
  referencia: string;
  pessoa: string;
  descricao: string;
  valor: number;
  saldo: number;
  vencimento: string;
  tipo: "receber" | "pagar";
}

export interface ResumoFinanceiro {
  saldoAtual: number;
  entradasMes: number;
  saidasMes: number;
  resultadoMes: number;

  aReceber: number;
  aPagar: number;

  vencidoReceber: number;
  vencidoPagar: number;

  quantidadeReceber: number;
  quantidadePagar: number;

  proximosRecebimentos: ItemFinanceiroPendente[];
  proximosPagamentos: ItemFinanceiroPendente[];

  ultimosLancamentos: LancamentoCaixa[];
}

function arredondar(valor: number): number {
  return Math.round((Number(valor) || 0) * 100) / 100;
}

function inicioDoMesAtual(): Date {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0, 0);
}

function fimDoMesAtual(): Date {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
}

function hojeSemHora(): Date {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
}

function dataValida(data: string): Date | null {
  const valor = new Date(data);
  return Number.isNaN(valor.getTime()) ? null : valor;
}

function montarRecebimentos(contas: ContaReceber[]): ItemFinanceiroPendente[] {
  const resultado: ItemFinanceiroPendente[] = [];

  for (const conta of contas) {
    if (conta.status === "cancelada") continue;

    for (const parcela of conta.parcelas) {
      if (parcela.status === "cancelada" || parcela.saldo <= 0) continue;

      const vencimento = dataValida(parcela.vencimento);
      if (!vencimento || vencimento < hojeSemHora()) continue;

      resultado.push({
        id: parcela.id,
        origemId: conta.id,
        referencia: `Venda #${conta.vendaNumero}`,
        pessoa: conta.clienteNome,
        descricao: conta.descricao,
        valor: arredondar(parcela.valorOriginal),
        saldo: arredondar(parcela.saldo),
        vencimento: parcela.vencimento,
        tipo: "receber",
      });
    }
  }

  return resultado
    .sort(
      (a, b) =>
        (dataValida(a.vencimento)?.getTime() ?? 0) -
        (dataValida(b.vencimento)?.getTime() ?? 0),
    )
    .slice(0, 5);
}

function montarPagamentos(contas: ContaPagar[]): ItemFinanceiroPendente[] {
  const resultado: ItemFinanceiroPendente[] = [];

  for (const conta of contas) {
    if (conta.status === "cancelada") continue;

    for (const parcela of conta.parcelas) {
      if (parcela.status === "cancelada" || parcela.saldo <= 0) continue;

      const vencimento = dataValida(parcela.vencimento);
      if (!vencimento || vencimento < hojeSemHora()) continue;

      resultado.push({
        id: parcela.id,
        origemId: conta.id,
        referencia: conta.compraNumero
          ? `Compra #${conta.compraNumero}`
          : "Compra",
        pessoa: conta.fornecedorNome,
        descricao: conta.descricao,
        valor: arredondar(parcela.valorOriginal),
        saldo: arredondar(parcela.saldo),
        vencimento: parcela.vencimento,
        tipo: "pagar",
      });
    }
  }

  return resultado
    .sort(
      (a, b) =>
        (dataValida(a.vencimento)?.getTime() ?? 0) -
        (dataValida(b.vencimento)?.getTime() ?? 0),
    )
    .slice(0, 5);
}

export function obterResumoFinanceiro(): ResumoFinanceiro {
  const contasReceber = atualizarStatusContasReceber();
  const contasPagar = atualizarContasPagarVencidas();

  const inicio = inicioDoMesAtual();
  const fim = fimDoMesAtual();

  const resumoCaixa = obterResumoCaixa();
  const resumoCaixaMes = obterResumoCaixa(
    inicio.toISOString().slice(0, 10),
    fim.toISOString().slice(0, 10),
  );

  const contasReceberAtivas = contasReceber.filter(
    (conta) => conta.status !== "cancelada",
  );

  const contasPagarAtivas = contasPagar.filter(
    (conta) => conta.status !== "cancelada",
  );

  const aReceber = arredondar(
    contasReceberAtivas.reduce((total, conta) => total + conta.saldo, 0),
  );

  const aPagar = arredondar(
    contasPagarAtivas.reduce((total, conta) => total + conta.saldo, 0),
  );

  const vencidoReceber = arredondar(
    contasReceber
      .filter((conta) => conta.status === "vencida")
      .reduce((total, conta) => total + conta.saldo, 0),
  );

  const vencidoPagar = arredondar(
    contasPagar
      .filter((conta) => conta.status === "vencida")
      .reduce((total, conta) => total + conta.saldo, 0),
  );

  const ultimosLancamentos = listarLancamentosCaixa().slice(0, 8);

  return {
    saldoAtual: arredondar(resumoCaixa.saldo),
    entradasMes: arredondar(resumoCaixaMes.entradas),
    saidasMes: arredondar(resumoCaixaMes.saidas),
    resultadoMes: arredondar(
      resumoCaixaMes.entradas - resumoCaixaMes.saidas,
    ),

    aReceber,
    aPagar,

    vencidoReceber,
    vencidoPagar,

    quantidadeReceber: contasReceberAtivas.filter(
      (conta) => conta.saldo > 0,
    ).length,
    quantidadePagar: contasPagarAtivas.filter(
      (conta) => conta.saldo > 0,
    ).length,

    proximosRecebimentos: montarRecebimentos(contasReceber),
    proximosPagamentos: montarPagamentos(contasPagar),

    ultimosLancamentos,
  };
}
