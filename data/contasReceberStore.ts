/**
 * Contas a Receber
 * Sistema ABR Agro
 *
 * Responsável por:
 * - armazenar títulos/parcelas originados de vendas;
 * - controlar recebimentos parciais e totais;
 * - calcular saldo;
 * - controlar vencimento;
 * - permitir cancelamento;
 * - manter histórico dos recebimentos.
 */

import type { FormaPagamento, ParcelaVenda, Venda } from "./vendasStore";
import { registrarEntradaVenda } from "./caixaStore";

export type StatusContaReceber =
  | "pendente"
  | "parcial"
  | "recebida"
  | "vencida"
  | "cancelada";

export interface RecebimentoConta {
  id: string;
  contaId: string;
  parcelaId: string;
  data: string;
  valor: number;
  formaPagamento: FormaPagamento;
  observacao?: string;
}

export interface ContaReceberParcela {
  id: string;
  numero: number;
  valorOriginal: number;
  valorRecebido: number;
  saldo: number;
  vencimento: string;
  status: StatusContaReceber;
}

export interface ContaReceber {
  id: string;

  vendaId: string;
  vendaNumero: string;

  clienteId: string;
  clienteNome: string;

  descricao: string;

  valorOriginal: number;
  valorRecebido: number;
  saldo: number;

  dataEmissao: string;
  dataVencimento: string;

  formaPagamento: FormaPagamento;

  status: StatusContaReceber;

  parcelas: ContaReceberParcela[];

  /**
   * Histórico dos recebimentos registrados nesta conta.
   *
   * Mantido dentro da própria conta para que o histórico continue
   * disponível mesmo após a página ser recarregada.
   */
  recebimentos?: RecebimentoConta[];

  observacao?: string;

  criadoEm: string;
  atualizadoEm: string;
}

export interface RegistrarRecebimentoParams {
  contaId: string;
  parcelaId?: string;
  valor: number;
  formaPagamento?: FormaPagamento;
  data?: string;
  observacao?: string;
}

const STORAGE_KEY = "abr-agro-contas-receber";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function agora(): string {
  return new Date().toISOString();
}

function gerarId(prefixo: string): string {
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function arredondar(valor: number): number {
  return Math.round((Number(valor) || 0) * 100) / 100;
}

function lerContas(): ContaReceber[] {
  if (!isBrowser()) return [];

  try {
    const bruto = window.localStorage.getItem(STORAGE_KEY);

    if (!bruto) return [];

    const dados = JSON.parse(bruto);

    if (!Array.isArray(dados)) return [];

    return dados;
  } catch {
    return [];
  }
}

const EVENTO_ATUALIZADO = "abr-agro-contas-receber-atualizadas";

function salvarContas(contas: ContaReceber[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contas));

  window.dispatchEvent(new CustomEvent(EVENTO_ATUALIZADO));
}

function normalizarParcela(parcela: ParcelaVenda): ContaReceberParcela {
  const valorOriginal = arredondar(parcela.valor);
  const valorRecebido = arredondar(parcela.valorRecebido);

  return {
    id: parcela.id,
    numero: parcela.numero,
    valorOriginal,
    valorRecebido: Math.min(valorOriginal, Math.max(0, valorRecebido)),
    saldo: arredondar(Math.max(0, valorOriginal - valorRecebido)),
    vencimento: parcela.vencimento,
    status:
      parcela.status === "cancelada"
        ? "cancelada"
        : valorRecebido >= valorOriginal && valorOriginal > 0
          ? "recebida"
          : valorRecebido > 0
            ? "parcial"
            : "pendente",
  };
}

function obterStatusParcela(
  parcela: ContaReceberParcela,
  referencia = new Date(),
): StatusContaReceber {
  if (parcela.status === "cancelada") {
    return "cancelada";
  }

  if (parcela.saldo <= 0) {
    return "recebida";
  }

  if (parcela.valorRecebido > 0) {
    return "parcial";
  }

  const vencimento = new Date(parcela.vencimento);

  if (
    !Number.isNaN(vencimento.getTime()) &&
    vencimento.getTime() < referencia.getTime()
  ) {
    return "vencida";
  }

  return "pendente";
}

function atualizarStatusConta(conta: ContaReceber): ContaReceber {
  const dataAtual = new Date();

  const parcelas = conta.parcelas.map((parcela) => ({
    ...parcela,
    saldo: arredondar(
      Math.max(0, parcela.valorOriginal - parcela.valorRecebido),
    ),
    status: obterStatusParcela(
      {
        ...parcela,
        saldo: arredondar(
          Math.max(0, parcela.valorOriginal - parcela.valorRecebido),
        ),
      },
      dataAtual,
    ),
  }));

  const valorOriginal = arredondar(
    parcelas.reduce((total, parcela) => total + parcela.valorOriginal, 0),
  );

  const valorRecebido = arredondar(
    parcelas.reduce((total, parcela) => total + parcela.valorRecebido, 0),
  );

  const saldo = arredondar(Math.max(0, valorOriginal - valorRecebido));

  let status: StatusContaReceber;

  if (conta.status === "cancelada") {
    status = "cancelada";
  } else if (saldo <= 0 && valorOriginal > 0) {
    status = "recebida";
  } else if (valorRecebido > 0) {
    status = "parcial";
  } else if (parcelas.some((parcela) => parcela.status === "vencida")) {
    status = "vencida";
  } else {
    status = "pendente";
  }

  return {
    ...conta,
    valorOriginal,
    valorRecebido,
    saldo,
    parcelas,
    status,
    dataVencimento:
      parcelas.length > 0
        ? parcelas.map((parcela) => parcela.vencimento).sort()[0]
        : conta.dataVencimento,
    atualizadoEm: agora(),
  };
}

export function listarContasReceber(): ContaReceber[] {
  return lerContas().map(atualizarStatusConta);
}

export function obterContaReceber(id: string): ContaReceber | null {
  const conta = lerContas().find((item) => item.id === id);

  return conta ? atualizarStatusConta(conta) : null;
}

export function buscarContasReceber(termo: string): ContaReceber[] {
  const busca = termo.trim().toLowerCase();

  if (!busca) {
    return listarContasReceber();
  }

  return listarContasReceber().filter((conta) =>
    [
      conta.id,
      conta.vendaId,
      conta.vendaNumero,
      conta.clienteId,
      conta.clienteNome,
      conta.descricao,
      conta.status,
      conta.formaPagamento,
    ]
      .filter(Boolean)
      .some((valor) => String(valor).toLowerCase().includes(busca)),
  );
}

export function listarContasPorVenda(vendaId: string): ContaReceber[] {
  return listarContasReceber().filter((conta) => conta.vendaId === vendaId);
}

export function listarContasPorCliente(clienteId: string): ContaReceber[] {
  return listarContasReceber().filter((conta) => conta.clienteId === clienteId);
}

export function criarContaReceberDaVenda(venda: Venda): ContaReceber | null {
  if (!venda.formaPagamento) {
    return null;
  }

  const contas = lerContas();

  const existente = contas.find((conta) => conta.vendaId === venda.id);

  if (existente) {
    return atualizarStatusConta(existente);
  }

  const parcelasOriginais = venda.condicaoPagamento?.parcelas;

  const parcelas =
    parcelasOriginais && parcelasOriginais.length > 0
      ? parcelasOriginais.map(normalizarParcela)
      : [
          {
            id: gerarId("parcela"),
            numero: 1,
            valorOriginal: arredondar(venda.total),
            valorRecebido: 0,
            saldo: arredondar(venda.total),
            vencimento: venda.dataVenda,
            status: "pendente" as StatusContaReceber,
          },
        ];

  const valorOriginal = arredondar(
    parcelas.reduce((total, parcela) => total + parcela.valorOriginal, 0),
  );

  const conta: ContaReceber = atualizarStatusConta({
    id: gerarId("conta-receber"),

    vendaId: venda.id,
    vendaNumero: venda.numero,

    clienteId: venda.clienteId,
    clienteNome: venda.clienteNome,

    descricao: `Venda ${venda.numero}`,

    valorOriginal,
    valorRecebido: 0,
    saldo: valorOriginal,

    dataEmissao: venda.dataVenda,
    dataVencimento:
      parcelas.map((parcela) => parcela.vencimento).sort()[0] ??
      venda.dataVenda,

    formaPagamento: venda.formaPagamento,

    status: "pendente",

    parcelas,

    recebimentos: [],

    observacao: venda.observacao,

    criadoEm: agora(),
    atualizadoEm: agora(),
  });

  contas.push(conta);
  salvarContas(contas);

  return conta;
}

export function criarContaReceber(
  dados: Omit<
    ContaReceber,
    "id" | "criadoEm" | "atualizadoEm" | "status" | "saldo" | "valorRecebido"
  > & {
    valorRecebido?: number;
    status?: StatusContaReceber;
  },
): ContaReceber {
  const contas = lerContas();

  const valorOriginal = arredondar(dados.valorOriginal);

  const valorRecebido = Math.min(
    valorOriginal,
    Math.max(0, arredondar(dados.valorRecebido ?? 0)),
  );

  const conta: ContaReceber = atualizarStatusConta({
    ...dados,
    id: gerarId("conta-receber"),
    valorOriginal,
    valorRecebido,
    saldo: arredondar(Math.max(0, valorOriginal - valorRecebido)),
    status: dados.status ?? "pendente",
    recebimentos: dados.recebimentos ?? [],
    criadoEm: agora(),
    atualizadoEm: agora(),
  });

  contas.push(conta);
  salvarContas(contas);

  return conta;
}

export function registrarRecebimento(params: RegistrarRecebimentoParams): {
  sucesso: boolean;
  mensagem: string;
  conta?: ContaReceber;
  recebimento?: RecebimentoConta;
} {
  const contas = lerContas();

  const indiceConta = contas.findIndex((conta) => conta.id === params.contaId);

  if (indiceConta === -1) {
    return {
      sucesso: false,
      mensagem: "Conta a receber não encontrada.",
    };
  }

  const contaAtual = atualizarStatusConta(contas[indiceConta]);

  if (contaAtual.status === "cancelada") {
    return {
      sucesso: false,
      mensagem: "Não é possível receber uma conta cancelada.",
    };
  }

  if (contaAtual.status === "recebida") {
    return {
      sucesso: false,
      mensagem: "Esta conta já está totalmente recebida.",
    };
  }

  const valor = arredondar(params.valor);

  if (!Number.isFinite(valor) || valor <= 0) {
    return {
      sucesso: false,
      mensagem: "Informe um valor de recebimento válido.",
    };
  }

  let parcelaIndex = -1;

  if (params.parcelaId) {
    parcelaIndex = contaAtual.parcelas.findIndex(
      (parcela) => parcela.id === params.parcelaId,
    );
  }

  if (parcelaIndex === -1) {
    parcelaIndex = contaAtual.parcelas.findIndex(
      (parcela) => parcela.saldo > 0 && parcela.status !== "cancelada",
    );
  }

  if (parcelaIndex === -1) {
    return {
      sucesso: false,
      mensagem: "Não existem parcelas em aberto.",
    };
  }

  const parcela = contaAtual.parcelas[parcelaIndex];

  if (valor > parcela.saldo + 0.001) {
    return {
      sucesso: false,
      mensagem: "O valor recebido não pode ser maior que o saldo da parcela.",
    };
  }

  const novoValorRecebido = arredondar(parcela.valorRecebido + valor);

  const novoSaldo = arredondar(
    Math.max(0, parcela.valorOriginal - novoValorRecebido),
  );

  contaAtual.parcelas[parcelaIndex] = {
    ...parcela,
    valorRecebido: novoValorRecebido,
    saldo: novoSaldo,
    status: novoSaldo <= 0 ? "recebida" : "parcial",
  };

  const contaAtualizada = atualizarStatusConta(contaAtual);

  const recebimento: RecebimentoConta = {
    id: gerarId("recebimento"),
    contaId: contaAtual.id,
    parcelaId: parcela.id,
    data: params.data ?? agora(),
    valor,
    formaPagamento: params.formaPagamento ?? contaAtual.formaPagamento,
    observacao: params.observacao,
  };

  const historicoRecebimentos = [
    ...(contaAtualizada.recebimentos ?? []),
    recebimento,
  ];

  const contaComHistorico: ContaReceber = {
    ...contaAtualizada,
    recebimentos: historicoRecebimentos,
    atualizadoEm: agora(),
  };

  contas[indiceConta] = contaComHistorico;
  salvarContas(contas);

  /*
   * Integração com o Caixa:
   *
   * Cada chamada bem-sucedida de registrarRecebimento representa
   * um recebimento financeiro real. Portanto, criamos uma única
   * entrada correspondente no caixa para este recebimento.
   *
   * O ID do recebimento é colocado na observação para manter
   * rastreabilidade sem alterar a estrutura já existente do caixa.
   */
  registrarEntradaVenda({
    valor: recebimento.valor,
    data: recebimento.data,
    formaPagamento: recebimento.formaPagamento,
    vendaId: contaAtual.id ? contaAtual.vendaId : undefined,
    vendaNumero: contaAtual.vendaNumero,
    contaReceberId: contaAtual.id,
    descricao: `Recebimento da venda #${contaAtual.vendaNumero}`,
    categoria: "Vendas",
    observacao: [
      `Recebimento ${recebimento.id}`,
      `Parcela ${parcela.numero}`,
      recebimento.observacao ? recebimento.observacao : "",
    ]
      .filter(Boolean)
      .join(" — "),
  });

  return {
    sucesso: true,
    mensagem:
      contaComHistorico.status === "recebida"
        ? "Conta recebida integralmente e entrada registrada no caixa."
        : "Recebimento registrado e entrada registrada no caixa.",
    conta: contaComHistorico,
    recebimento,
  };
}

export function cancelarContaReceber(id: string): {
  sucesso: boolean;
  mensagem: string;
  conta?: ContaReceber;
} {
  const contas = lerContas();

  const indice = contas.findIndex((conta) => conta.id === id);

  if (indice === -1) {
    return {
      sucesso: false,
      mensagem: "Conta a receber não encontrada.",
    };
  }

  const conta = contas[indice];

  if (conta.status === "recebida") {
    return {
      sucesso: false,
      mensagem: "Não é possível cancelar uma conta totalmente recebida.",
    };
  }

  const cancelada: ContaReceber = {
    ...conta,
    status: "cancelada",
    parcelas: conta.parcelas.map((parcela) => ({
      ...parcela,
      status: "cancelada",
    })),
    atualizadoEm: agora(),
  };

  contas[indice] = cancelada;
  salvarContas(contas);

  return {
    sucesso: true,
    mensagem: "Conta a receber cancelada com sucesso.",
    conta: cancelada,
  };
}

export function excluirContaReceber(id: string): boolean {
  const contas = lerContas();
  const novas = contas.filter((conta) => conta.id !== id);

  if (novas.length === contas.length) {
    return false;
  }

  salvarContas(novas);
  return true;
}

export function atualizarContaReceber(
  id: string,
  dados: Partial<
    Pick<
      ContaReceber,
      "descricao" | "dataVencimento" | "formaPagamento" | "observacao"
    >
  >,
): ContaReceber | null {
  const contas = lerContas();

  const indice = contas.findIndex((conta) => conta.id === id);

  if (indice === -1) {
    return null;
  }

  const atualizada = atualizarStatusConta({
    ...contas[indice],
    ...dados,
    atualizadoEm: agora(),
  });

  contas[indice] = atualizada;
  salvarContas(contas);

  return atualizada;
}

export function obterResumoContasReceber(): {
  total: number;
  pendentes: number;
  vencidas: number;
  parciais: number;
  recebidas: number;
  canceladas: number;
  valorTotal: number;
  valorRecebido: number;
  saldoAberto: number;
} {
  const contas = listarContasReceber();

  return {
    total: contas.length,

    pendentes: contas.filter((conta) => conta.status === "pendente").length,

    vencidas: contas.filter((conta) => conta.status === "vencida").length,

    parciais: contas.filter((conta) => conta.status === "parcial").length,

    recebidas: contas.filter((conta) => conta.status === "recebida").length,

    canceladas: contas.filter((conta) => conta.status === "cancelada").length,

    valorTotal: arredondar(
      contas.reduce((total, conta) => total + conta.valorOriginal, 0),
    ),

    valorRecebido: arredondar(
      contas.reduce((total, conta) => total + conta.valorRecebido, 0),
    ),

    saldoAberto: arredondar(
      contas.reduce(
        (total, conta) =>
          total + (conta.status === "cancelada" ? 0 : conta.saldo),
        0,
      ),
    ),
  };
}

/**
 * Atualiza os status de todas as contas com base na data atual.
 * Não altera valores financeiros.
 */
export function atualizarStatusContasReceber(): ContaReceber[] {
  const originais = lerContas();
  const contas = originais.map(atualizarStatusConta);

  const houveAlteracao = contas.some(
    (conta, indice) => conta.status !== originais[indice]?.status,
  );

  if (houveAlteracao) {
    salvarContas(contas);
  }

  return contas;
}
