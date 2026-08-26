"use client";

import {
  estornarMovimentacao,
  obterMovimentacoes,
  registrarMovimentacao,
} from "./movimentacoesStore";
import {
  cancelarContaPagar,
  criarContaPagarDaCompra,
  estornarPagamentosContaPagar,
  obterContaPagar,
  registrarPagamento,
} from "./contasPagarStore";
import {
  obterConfiguracoes,
  atualizarConfiguracoes,
} from "./configuracoesStore";

export type StatusCompra =
  | "rascunho"
  | "pendente"
  | "parcial"
  | "recebida"
  | "cancelada";

export type FormaPagamentoCompra =
  | "pix"
  | "dinheiro"
  | "cartao_credito"
  | "cartao_debito"
  | "boleto"
  | "transferencia"
  | "outro";

export type TipoCondicaoPagamentoCompra = "avista" | "parcelado";

export type CondicaoPagamentoCompra = {
  tipo: TipoCondicaoPagamentoCompra;
  quantidadeParcelas: number;
  intervaloDias: number;
  parcelas: Array<{
    id: string;
    numero: number;
    valor: number;
    vencimento: string;
  }>;
};

export type ItemCompra = {
  produtoId: string;
  produtoCodigo: string;
  produtoNome: string;

  quantidade: number;
  quantidadeRecebida: number;

  valorUnitario: number;
  desconto: number;
  subtotal: number;
};

export type Compra = {
  id: string;

  numero: string;

  fornecedorId: string;
  fornecedorNome: string;

  itens: ItemCompra[];

  desconto: number;
  frete: number;

  subtotal: number;
  total: number;

  formaPagamento?: FormaPagamentoCompra;
  condicaoPagamento?: CondicaoPagamentoCompra;

  status: StatusCompra;

  observacao?: string;

  dataCompra: string;
  dataPrevisao?: string;
  dataRecebimento?: string;

  /**
   * Indica que as entradas de estoque desta compra
   * já foram estornadas durante um cancelamento.
   */
  estoqueEstornado?: boolean;

  criadoEm: string;
  atualizadoEm: string;
};

const CHAVE_COMPRAS = "sistema-abr-compras";

function temJanela() {
  return typeof window !== "undefined";
}

function gerarId() {
  return `compra-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function gerarNumeroCompra() {
  const configuracoes = obterConfiguracoes().comercial;
  const compras = obterCompras();

  let maiorNumero = 0;

  for (const compra of compras) {
    const numero = Number(compra.numero.replace(/\D/g, ""));

    if (Number.isFinite(numero) && numero > maiorNumero) {
      maiorNumero = numero;
    }
  }

  const configurado = Math.max(
    1,
    Math.floor(Number(configuracoes.proximoNumeroCompra) || 1),
  );

  const proximo = Math.max(configurado, maiorNumero + 1);
  const prefixo = configuracoes.prefixoCompra.trim().toUpperCase();

  return `${prefixo}${String(proximo).padStart(5, "0")}`;
}

function calcularSubtotalItens(itens: ItemCompra[]) {
  return itens.reduce((total, item) => {
    return total + item.subtotal;
  }, 0);
}

function calcularTotalCompra(
  subtotal: number,
  desconto: number,
  frete: number,
) {
  return Math.max(0, subtotal - desconto + frete);
}

export function obterCompras(): Compra[] {
  if (!temJanela()) {
    return [];
  }

  try {
    const comprasSalvas = localStorage.getItem(CHAVE_COMPRAS);

    if (!comprasSalvas) {
      return [];
    }

    const compras = JSON.parse(comprasSalvas);

    if (!Array.isArray(compras)) {
      return [];
    }

    return compras;
  } catch {
    return [];
  }
}

function salvarCompras(compras: Compra[]) {
  if (!temJanela()) {
    return;
  }

  localStorage.setItem(CHAVE_COMPRAS, JSON.stringify(compras));

  window.dispatchEvent(
    new CustomEvent("abr-agro-compras-atualizadas", {
      detail: compras,
    }),
  );
}

export function obterCompraPorId(id: string): Compra | undefined {
  const compras = obterCompras();

  return compras.find((compra) => compra.id === id);
}

function formaPagamentoCompraHabilitada(forma?: FormaPagamentoCompra): boolean {
  if (!forma) return false;

  return obterConfiguracoes().comercial.formasPagamento.includes(forma);
}

function consumirNumeroCompra(numero: string): void {
  const configuracoes = obterConfiguracoes();
  const numeroUsado = Number(numero.replace(/\D/g, ""));

  if (!Number.isFinite(numeroUsado)) return;

  atualizarConfiguracoes({
    comercial: {
      ...configuracoes.comercial,
      proximoNumeroCompra: Math.max(
        configuracoes.comercial.proximoNumeroCompra,
        numeroUsado + 1,
      ),
    },
  });
}

export function criarCompra(
  dados: Omit<
    Compra,
    | "id"
    | "numero"
    | "subtotal"
    | "total"
    | "status"
    | "criadoEm"
    | "atualizadoEm"
  > & {
    status?: StatusCompra;
  },
): Compra {
  const compras = obterCompras();

  if (
    dados.formaPagamento &&
    !formaPagamentoCompraHabilitada(dados.formaPagamento)
  ) {
    throw new Error(
      "A forma de pagamento da compra está desativada nas configurações.",
    );
  }

  const agora = new Date().toISOString();

  const itensCalculados = dados.itens.map((item) => {
    const quantidade = Number(item.quantidade) || 0;

    const valorUnitario = Number(item.valorUnitario) || 0;

    const desconto = Number(item.desconto) || 0;

    const subtotalBruto = quantidade * valorUnitario;

    const subtotal = Math.max(0, subtotalBruto - desconto);

    return {
      ...item,

      quantidade,

      quantidadeRecebida: Number(item.quantidadeRecebida) || 0,

      valorUnitario,

      desconto,

      subtotal,
    };
  });

  const subtotal = calcularSubtotalItens(itensCalculados);

  const desconto = Number(dados.desconto) || 0;

  const frete = Number(dados.frete) || 0;

  const compra: Compra = {
    id: gerarId(),

    numero: gerarNumeroCompra(),

    fornecedorId: dados.fornecedorId,

    fornecedorNome: dados.fornecedorNome,

    itens: itensCalculados,

    desconto,

    frete,

    subtotal,

    total: calcularTotalCompra(subtotal, desconto, frete),

    formaPagamento: dados.formaPagamento,

    condicaoPagamento: dados.condicaoPagamento,

    status: dados.status ?? "pendente",

    observacao: dados.observacao,

    dataCompra: dados.dataCompra,

    dataPrevisao: dados.dataPrevisao,

    criadoEm: agora,

    atualizadoEm: agora,
  };

  salvarCompras([compra, ...compras]);
  consumirNumeroCompra(compra.numero);

  /*
   * Integração com Contas a Pagar.
   * A compra cria a obrigação financeira, mas só gera saída no Caixa
   * quando o pagamento é efetivamente registrado.
   */
  if (compra.status !== "rascunho" && compra.total > 0) {
    const conta = criarContaPagarDaCompra(
      {
        id: compra.id,
        numero: compra.numero,
        fornecedorId: compra.fornecedorId,
        fornecedorNome: compra.fornecedorNome,
        total: compra.total,
        dataCompra: compra.dataCompra,
        dataPrevisao:
          compra.condicaoPagamento?.parcelas[0]?.vencimento ??
          compra.dataPrevisao ??
          compra.dataCompra,
        observacao: compra.observacao,
      },
      {
        formaPagamento: compra.formaPagamento ?? "outro",
        parcelas: compra.condicaoPagamento?.parcelas.map((parcela) => ({
          valor: parcela.valor,
          vencimento: parcela.vencimento,
        })) ?? [
          {
            valor: compra.total,
            vencimento: compra.dataPrevisao ?? compra.dataCompra,
          },
        ],
      },
    );

    // Compra à vista representa pagamento imediato. A obrigação é criada
    // primeiro e o pagamento é lançado em seguida, garantindo que o Caixa
    // receba exatamente uma saída vinculada ao pagamento.
    if (compra.condicaoPagamento?.tipo === "avista" && conta.saldo > 0) {
      const resultado = registrarPagamento({
        contaId: conta.id,
        parcelaId: conta.parcelas[0]?.id,
        valor: conta.saldo,
        formaPagamento: compra.formaPagamento,
        data: compra.dataCompra,
        observacao: `Pagamento à vista da compra ${compra.numero}.`,
      });

      if (!resultado.sucesso) {
        console.warn(
          `A compra ${compra.numero} foi criada, mas o pagamento à vista não foi registrado:`,
          resultado.mensagem,
        );
      }
    }
  }

  return compra;
}

export function atualizarCompra(
  id: string,
  dados: Partial<Omit<Compra, "id" | "numero" | "criadoEm">>,
): Compra | null {
  const compras = obterCompras();

  const indice = compras.findIndex((compra) => compra.id === id);

  if (indice === -1) {
    return null;
  }

  const compraAtual = compras[indice];

  const itens = dados.itens ?? compraAtual.itens;

  const itensCalculados = itens.map((item) => {
    const quantidade = Number(item.quantidade) || 0;

    const valorUnitario = Number(item.valorUnitario) || 0;

    const desconto = Number(item.desconto) || 0;

    return {
      ...item,

      quantidade,

      quantidadeRecebida: Math.min(
        Number(item.quantidadeRecebida) || 0,
        quantidade,
      ),

      valorUnitario,

      desconto,

      subtotal: Math.max(0, quantidade * valorUnitario - desconto),
    };
  });

  const subtotal = calcularSubtotalItens(itensCalculados);

  const desconto = dados.desconto ?? compraAtual.desconto;

  const frete = dados.frete ?? compraAtual.frete;

  const compraAtualizada: Compra = {
    ...compraAtual,

    ...dados,

    itens: itensCalculados,

    desconto,

    frete,

    subtotal,

    total: calcularTotalCompra(subtotal, desconto, frete),

    atualizadoEm: new Date().toISOString(),
  };

  compras[indice] = compraAtualizada;

  salvarCompras(compras);

  return compraAtualizada;
}

export type QuantidadesRecebimento = Record<string, number>;

export function receberCompra(
  id: string,
  quantidades?: QuantidadesRecebimento,
): Compra {
  const compra = obterCompraPorId(id);

  if (!compra) {
    throw new Error("Compra não encontrada.");
  }

  if (compra.status === "cancelada") {
    throw new Error("Não é possível receber uma compra cancelada.");
  }

  if (compra.status === "recebida") {
    throw new Error("Esta compra já foi totalmente recebida.");
  }

  /*
   * Primeiro calculamos exatamente
   * o que será recebido.
   *
   * Se nenhuma quantidade for
   * informada, recebemos tudo
   * que ainda estiver pendente.
   */

  const itensRecebimento = compra.itens.map((item) => {
    const quantidadeComprada = Number(item.quantidade) || 0;

    const quantidadeRecebidaAtual = Number(item.quantidadeRecebida) || 0;

    const quantidadePendente = Math.max(
      0,
      quantidadeComprada - quantidadeRecebidaAtual,
    );

    const quantidadeSolicitada = quantidades
      ? Number(quantidades[item.produtoId]) || 0
      : quantidadePendente;

    if (quantidadeSolicitada < 0) {
      throw new Error(
        `A quantidade recebida do produto ${item.produtoNome} não pode ser negativa.`,
      );
    }

    if (quantidadeSolicitada > quantidadePendente) {
      throw new Error(
        `A quantidade recebida de ${item.produtoNome} excede o saldo pendente. Pendente: ${quantidadePendente}.`,
      );
    }

    return {
      item,
      quantidadeComprada,
      quantidadeRecebidaAtual,
      quantidadePendente,
      quantidadeRecebidaAgora: quantidadeSolicitada,
    };
  });

  const existeRecebimento = itensRecebimento.some(
    (item) => item.quantidadeRecebidaAgora > 0,
  );

  if (!existeRecebimento) {
    throw new Error("Informe pelo menos uma quantidade para recebimento.");
  }

  /*
   * Antes de alterar qualquer
   * produto, validamos todos os
   * itens.
   */

  for (const recebimento of itensRecebimento) {
    if (recebimento.quantidadeRecebidaAgora <= 0) {
      continue;
    }

    if (!recebimento.item.produtoCodigo) {
      throw new Error(
        `O produto ${recebimento.item.produtoNome} não possui código válido.`,
      );
    }
  }

  /*
   * Agora registramos a entrada
   * de cada produto.
   *
   * registrarMovimentacao()
   * já:
   *
   * 1. localiza o produto;
   * 2. calcula o novo estoque;
   * 3. atualiza o produto;
   * 4. cria a movimentação;
   * 5. registra estoque anterior
   *    e estoque atual.
   */

  for (const recebimento of itensRecebimento) {
    const quantidade = recebimento.quantidadeRecebidaAgora;

    if (quantidade <= 0) {
      continue;
    }

    registrarMovimentacao({
      codigoProduto: recebimento.item.produtoCodigo,

      tipo: "entrada",

      motivo: "compra",

      quantidade,

      observacao: `Recebimento da compra ${compra.numero} — fornecedor: ${compra.fornecedorNome}.`,

      compraId: compra.id,
      compraNumero: compra.numero,
    });
  }

  /*
   * Atualiza as quantidades
   * recebidas da compra.
   */

  const itensAtualizados = compra.itens.map((item) => {
    const recebimento = itensRecebimento.find(
      (registro) => registro.item.produtoId === item.produtoId,
    );

    if (!recebimento) {
      return item;
    }

    return {
      ...item,

      quantidadeRecebida:
        recebimento.quantidadeRecebidaAtual +
        recebimento.quantidadeRecebidaAgora,
    };
  });

  /*
   * Verifica se todos os
   * produtos foram recebidos.
   */

  const recebimentoTotal = itensAtualizados.every(
    (item) => item.quantidadeRecebida >= item.quantidade,
  );

  const novoStatus: StatusCompra = recebimentoTotal ? "recebida" : "parcial";

  const agora = new Date().toISOString();

  const compraAtualizada: Compra = {
    ...compra,

    itens: itensAtualizados,

    status: novoStatus,

    dataRecebimento: recebimentoTotal ? agora : compra.dataRecebimento,

    atualizadoEm: agora,
  };

  const compras = obterCompras();

  const indice = compras.findIndex((item) => item.id === id);

  if (indice === -1) {
    throw new Error("Não foi possível atualizar a compra após o recebimento.");
  }

  compras[indice] = compraAtualizada;

  salvarCompras(compras);

  return compraAtualizada;
}

function estornarEstoqueCompra(compra: Compra): void {
  if (compra.estoqueEstornado) {
    return;
  }

  const movimentacoes = obterMovimentacoes();

  /*
   * Estorna somente as entradas de estoque originadas por esta
   * compra e ainda não estornadas.
   *
   * Isso também funciona para recebimento parcial:
   * se foram recebidas 30 de 100 unidades, somente as 30
   * que realmente entraram no estoque serão estornadas.
   */
  const entradasDaCompra = movimentacoes.filter(
    (movimentacao) =>
      movimentacao.compraId === compra.id &&
      movimentacao.tipo === "entrada" &&
      movimentacao.motivo === "compra" &&
      !movimentacao.estornada,
  );

  for (const movimentacao of entradasDaCompra) {
    estornarMovimentacao(movimentacao.id);
  }
}

export function cancelarCompra(id: string): Compra {
  const compra = obterCompraPorId(id);

  if (!compra) {
    throw new Error("Compra não encontrada.");
  }

  if (compra.status === "cancelada") {
    throw new Error("Esta compra já está cancelada.");
  }

  /*
   * Primeiro desfazemos o que já entrou no estoque.
   * Compras sem recebimento não possuem entradas para estornar.
   */
  const possuiRecebimento = compra.itens.some(
    (item) => Number(item.quantidadeRecebida ?? 0) > 0,
  );

  if (possuiRecebimento) {
    estornarEstoqueCompra(compra);
  }

  /*
   * Depois tratamos a parte financeira.
   *
   * Se houve pagamentos, estornamos as saídas no Caixa e
   * preservamos o histórico dos pagamentos.
   *
   * Se não houve pagamentos, cancelamos somente a obrigação.
   */
  const contaPagar = obterContaPagar(compra.id);

  if (contaPagar && contaPagar.status !== "cancelada") {
    if (contaPagar.valorPago > 0) {
      const resultadoEstorno = estornarPagamentosContaPagar(contaPagar.id);

      if (!resultadoEstorno.sucesso) {
        throw new Error(resultadoEstorno.mensagem);
      }
    } else {
      const resultadoCancelamento = cancelarContaPagar(contaPagar.id);

      if (!resultadoCancelamento.sucesso) {
        throw new Error(resultadoCancelamento.mensagem);
      }
    }
  }

  /*
   * Somente depois de estoque e financeiro serem processados,
   * marcamos a compra como cancelada.
   */
  const compraCancelada = atualizarCompra(id, {
    status: "cancelada",
    estoqueEstornado: possuiRecebimento,
  });

  if (!compraCancelada) {
    throw new Error("Não foi possível cancelar a compra.");
  }

  return compraCancelada;
}

export function obterResumoCompras() {
  const compras = obterCompras();

  const totalCompras = compras.length;

  const pendentes = compras.filter(
    (compra) => compra.status === "pendente",
  ).length;

  const parcialmenteRecebidas = compras.filter(
    (compra) => compra.status === "parcial",
  ).length;

  const recebidas = compras.filter(
    (compra) => compra.status === "recebida",
  ).length;

  const canceladas = compras.filter(
    (compra) => compra.status === "cancelada",
  ).length;

  const valorTotal = compras
    .filter((compra) => compra.status !== "cancelada")
    .reduce((total, compra) => total + compra.total, 0);

  return {
    totalCompras,
    pendentes,
    parcialmenteRecebidas,
    recebidas,
    canceladas,
    valorTotal,
  };
}

export function obterStatusCompraLabel(status: StatusCompra) {
  const labels: Record<StatusCompra, string> = {
    rascunho: "Rascunho",
    pendente: "Pendente",
    parcial: "Parcialmente recebida",
    recebida: "Recebida",
    cancelada: "Cancelada",
  };

  return labels[status];
}
