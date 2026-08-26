/**
 * Contas a Pagar
 * Sistema ABR Agro
 *
 * Store responsável pelo controle financeiro das compras:
 * - criação automática/manual de contas;
 * - parcelas;
 * - pagamentos parciais e integrais;
 * - histórico de pagamentos;
 * - vencimentos e status;
 * - vínculo com compras;
 *
 * A integração com o Caixa será feita pelo registro de pagamento,
 * usando registrarSaidaCompra() do caixaStore.
 */

import {
  estornarLancamentoCaixa,
  listarLancamentosCaixa,
  registrarSaidaCompra,
} from "./caixaStore";

export type StatusContaPagar =
  | "pendente"
  | "parcial"
  | "paga"
  | "vencida"
  | "cancelada";

export type ParcelaContaPagar = {
  id: string;
  numero: number;
  valorOriginal: number;
  valorPago: number;
  saldo: number;
  vencimento: string;
  status: StatusContaPagar;
};

export type PagamentoContaPagar = {
  id: string;
  contaId: string;
  parcelaId: string;
  data: string;
  valor: number;
  formaPagamento: string;
  observacao?: string;
};

export type ContaPagar = {
  id: string;

  compraId?: string;
  compraNumero?: string;

  fornecedorId: string;
  fornecedorNome: string;

  descricao: string;

  valorOriginal: number;
  valorPago: number;
  saldo: number;

  dataEmissao: string;
  dataVencimento: string;

  formaPagamento: string;

  status: StatusContaPagar;

  parcelas: ParcelaContaPagar[];

  pagamentos: PagamentoContaPagar[];

  observacao?: string;

  criadoEm: string;
  atualizadoEm: string;
};

export type CriarContaPagarParams = {
  compraId?: string;
  compraNumero?: string;

  fornecedorId: string;
  fornecedorNome: string;

  descricao: string;

  valorOriginal: number;

  dataEmissao?: string;
  dataVencimento?: string;

  formaPagamento: string;

  parcelas?: Array<{
    valor: number;
    vencimento: string;
  }>;

  observacao?: string;
};

export type RegistrarPagamentoParams = {
  contaId: string;

  parcelaId?: string;

  valor: number;

  formaPagamento?: string;

  data?: string;

  observacao?: string;
};

const CHAVE_CONTAS_PAGAR = "sistema-abr-contas-pagar";

function temJanela() {
  return typeof window !== "undefined";
}

function agora() {
  return new Date().toISOString();
}

function arredondar(valor: number) {
  return Math.round((Number(valor) || 0) * 100) / 100;
}

function gerarId(prefixo: string) {
  return `${prefixo}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
}

function salvarContas(contas: ContaPagar[]) {
  if (!temJanela()) {
    return;
  }

  localStorage.setItem(CHAVE_CONTAS_PAGAR, JSON.stringify(contas));

  window.dispatchEvent(
    new CustomEvent("abr-agro-contas-pagar-atualizadas", {
      detail: contas,
    }),
  );
}

export function listarContasPagar(): ContaPagar[] {
  if (!temJanela()) {
    return [];
  }

  try {
    const salvo = localStorage.getItem(CHAVE_CONTAS_PAGAR);

    if (!salvo) {
      return [];
    }

    const contas = JSON.parse(salvo);

    if (!Array.isArray(contas)) {
      return [];
    }

    return contas;
  } catch {
    return [];
  }
}

export function obterContaPagar(id: string): ContaPagar | null {
  return listarContasPagar().find((conta) => conta.id === id) ?? null;
}

function atualizarStatusParcela(parcela: ParcelaContaPagar): ParcelaContaPagar {
  const valorOriginal = arredondar(parcela.valorOriginal);

  const valorPago = arredondar(parcela.valorPago);

  const saldo = arredondar(Math.max(0, valorOriginal - valorPago));

  let status: StatusContaPagar;

  if (saldo <= 0.009) {
    status = "paga";
  } else if (valorPago > 0) {
    status = "parcial";
  } else if (
    new Date(parcela.vencimento).getTime() < new Date().setHours(0, 0, 0, 0)
  ) {
    status = "vencida";
  } else {
    status = "pendente";
  }

  return {
    ...parcela,
    valorOriginal,
    valorPago,
    saldo,
    status,
  };
}

function atualizarStatusConta(conta: ContaPagar): ContaPagar {
  const parcelas = conta.parcelas.map(atualizarStatusParcela);

  const valorOriginal = arredondar(
    parcelas.reduce((total, parcela) => total + parcela.valorOriginal, 0),
  );

  const valorPago = arredondar(
    parcelas.reduce((total, parcela) => total + parcela.valorPago, 0),
  );

  const saldo = arredondar(Math.max(0, valorOriginal - valorPago));

  let status: StatusContaPagar;

  if (conta.status === "cancelada") {
    status = "cancelada";
  } else if (saldo <= 0.009) {
    status = "paga";
  } else if (valorPago > 0) {
    status = "parcial";
  } else if (parcelas.some((parcela) => parcela.status === "vencida")) {
    status = "vencida";
  } else {
    status = "pendente";
  }

  return {
    ...conta,
    valorOriginal,
    valorPago,
    saldo,
    parcelas,
    status,
  };
}

function criarParcelas(
  valor: number,
  dataVencimento: string,
  parcelasInformadas?: Array<{
    valor: number;
    vencimento: string;
  }>,
): ParcelaContaPagar[] {
  if (parcelasInformadas && parcelasInformadas.length > 0) {
    return parcelasInformadas.map((parcela, indice) =>
      atualizarStatusParcela({
        id: gerarId("parcela-pagar"),
        numero: indice + 1,
        valorOriginal: arredondar(parcela.valor),
        valorPago: 0,
        saldo: arredondar(parcela.valor),
        vencimento: parcela.vencimento,
        status: "pendente",
      }),
    );
  }

  return [
    atualizarStatusParcela({
      id: gerarId("parcela-pagar"),
      numero: 1,
      valorOriginal: arredondar(valor),
      valorPago: 0,
      saldo: arredondar(valor),
      vencimento: dataVencimento,
      status: "pendente",
    }),
  ];
}

export function criarContaPagar(dados: CriarContaPagarParams): ContaPagar {
  if (!dados.fornecedorId) {
    throw new Error("Informe o fornecedor da conta.");
  }

  if (!dados.fornecedorNome) {
    throw new Error("Informe o nome do fornecedor.");
  }

  const valor = arredondar(dados.valorOriginal);

  if (valor <= 0) {
    throw new Error("O valor da conta deve ser maior que zero.");
  }

  const dataEmissao = dados.dataEmissao ?? agora();

  const dataVencimento = dados.dataVencimento ?? dataEmissao;

  const parcelas = criarParcelas(valor, dataVencimento, dados.parcelas);

  const contaBase: ContaPagar = {
    id: gerarId("conta-pagar"),

    compraId: dados.compraId,

    compraNumero: dados.compraNumero,

    fornecedorId: dados.fornecedorId,

    fornecedorNome: dados.fornecedorNome,

    descricao: dados.descricao.trim(),

    valorOriginal: valor,

    valorPago: 0,

    saldo: valor,

    dataEmissao,

    dataVencimento,

    formaPagamento: dados.formaPagamento,

    status: "pendente",

    parcelas,

    pagamentos: [],

    observacao: dados.observacao?.trim() || undefined,

    criadoEm: agora(),

    atualizadoEm: agora(),
  };

  const conta = atualizarStatusConta(contaBase);

  const contas = listarContasPagar();

  contas.unshift(conta);

  salvarContas(contas);

  return conta;
}

/**
 * Cria uma conta a pagar a partir de uma compra.
 *
 * Não cria duplicidade para a mesma compra.
 */
export function criarContaPagarDaCompra(
  compra: {
    id: string;
    numero: string;
    fornecedorId: string;
    fornecedorNome: string;
    total: number;
    dataCompra: string;
    dataPrevisao?: string;
    observacao?: string;
  },
  dadosPagamento?: {
    formaPagamento?: string;
    parcelas?: Array<{
      valor: number;
      vencimento: string;
    }>;
  },
): ContaPagar {
  const existente = listarContasPagar().find(
    (conta) => conta.compraId === compra.id,
  );

  if (existente) {
    return existente;
  }

  return criarContaPagar({
    compraId: compra.id,

    compraNumero: compra.numero,

    fornecedorId: compra.fornecedorId,

    fornecedorNome: compra.fornecedorNome,

    descricao: `Compra ${compra.numero}`,

    valorOriginal: compra.total,

    dataEmissao: compra.dataCompra,

    dataVencimento: compra.dataPrevisao ?? compra.dataCompra,

    formaPagamento: dadosPagamento?.formaPagamento ?? "Não informado",

    parcelas: dadosPagamento?.parcelas,

    observacao: compra.observacao,
  });
}

export function registrarPagamento(params: RegistrarPagamentoParams): {
  sucesso: boolean;
  mensagem: string;
  conta?: ContaPagar;
  pagamento?: PagamentoContaPagar;
} {
  const contas = listarContasPagar();

  const indiceConta = contas.findIndex((conta) => conta.id === params.contaId);

  if (indiceConta === -1) {
    return {
      sucesso: false,
      mensagem: "Conta a pagar não encontrada.",
    };
  }

  const conta = contas[indiceConta];

  if (conta.status === "cancelada") {
    return {
      sucesso: false,
      mensagem: "Não é possível pagar uma conta cancelada.",
    };
  }

  if (conta.saldo <= 0) {
    return {
      sucesso: false,
      mensagem: "Esta conta já está totalmente paga.",
    };
  }

  const parcela = params.parcelaId
    ? conta.parcelas.find((item) => item.id === params.parcelaId)
    : conta.parcelas.find((item) => item.saldo > 0);

  if (!parcela) {
    return {
      sucesso: false,
      mensagem: "Nenhuma parcela com saldo foi encontrada.",
    };
  }

  const valor = arredondar(params.valor);

  if (valor <= 0) {
    return {
      sucesso: false,
      mensagem: "Informe um valor de pagamento válido.",
    };
  }

  if (valor > parcela.saldo + 0.001) {
    return {
      sucesso: false,
      mensagem: `O pagamento não pode ser maior que o saldo da parcela (${new Intl.NumberFormat(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL",
        },
      ).format(parcela.saldo)}).`,
    };
  }

  const formaPagamento = params.formaPagamento ?? conta.formaPagamento;

  if (!formaPagamento) {
    return {
      sucesso: false,
      mensagem: "Informe a forma de pagamento.",
    };
  }

  const pagamento: PagamentoContaPagar = {
    id: gerarId("pagamento-pagar"),

    contaId: conta.id,

    parcelaId: parcela.id,

    data: params.data ?? agora(),

    valor,

    formaPagamento,

    observacao: params.observacao?.trim() || undefined,
  };

  // Segurança contra duplicidade.
  // Um pagamento já registrado para a mesma conta/parcela,
  // com os mesmos dados financeiros, não deve gerar uma nova saída.
  const pagamentoExistente = (conta.pagamentos ?? []).find(
    (item) =>
      item.contaId === conta.id &&
      item.parcelaId === parcela.id &&
      arredondar(item.valor) === valor &&
      item.data === pagamento.data &&
      item.formaPagamento === pagamento.formaPagamento &&
      item.observacao === pagamento.observacao,
  );

  if (pagamentoExistente) {
    return {
      sucesso: false,
      mensagem: "Este pagamento já foi registrado.",
      conta,
      pagamento: pagamentoExistente,
    };
  }

  const parcelasAtualizadas = conta.parcelas.map((item) => {
    if (item.id !== parcela.id) {
      return item;
    }

    return atualizarStatusParcela({
      ...item,
      valorPago: item.valorPago + valor,
    });
  });

  const contaAtualizada = atualizarStatusConta({
    ...conta,
    parcelas: parcelasAtualizadas,
    pagamentos: [...(conta.pagamentos ?? []), pagamento],
    atualizadoEm: agora(),
  });

  contas[indiceConta] = contaAtualizada;

  salvarContas(contas);

  /*
   * O pagamento foi salvo com sucesso.
   * Agora registramos a saída correspondente no Caixa.
   *
   * Como o lançamento utiliza o ID da conta e o ID do pagamento
   * na observação, cada pagamento parcial gera sua própria saída,
   * sem apagar o histórico anterior.
   */
  registrarSaidaCompra({
    valor: pagamento.valor,

    data: pagamento.data,

    formaPagamento: pagamento.formaPagamento,

    compraId: conta.compraId,

    compraNumero: conta.compraNumero,

    contaPagarId: conta.id,

    descricao: `Pagamento da compra ${
      conta.compraNumero ? `#${conta.compraNumero}` : conta.descricao
    }`,

    categoria: "Compras",

    observacao: [
      `Pagamento ${pagamento.id}`,
      `Parcela ${parcela.numero}`,
      pagamento.observacao ?? "",
    ]
      .filter(Boolean)
      .join(" — "),
  });

  return {
    sucesso: true,

    mensagem:
      contaAtualizada.status === "paga"
        ? "Conta paga integralmente e saída registrada no caixa."
        : "Pagamento registrado e saída registrada no caixa.",

    conta: contaAtualizada,

    pagamento,
  };
}

export function estornarPagamentosContaPagar(contaId: string): {
  sucesso: boolean;
  mensagem: string;
  conta?: ContaPagar;
} {
  const contas = listarContasPagar();

  const indiceConta = contas.findIndex((conta) => conta.id === contaId);

  if (indiceConta === -1) {
    return {
      sucesso: false,
      mensagem: "Conta a pagar não encontrada.",
    };
  }

  const conta = contas[indiceConta];

  const lancamentos = listarLancamentosCaixa();

  const lancamentosDaConta = lancamentos.filter(
    (lancamento) =>
      lancamento.origem === "compra" &&
      lancamento.contaPagarId === conta.id &&
      lancamento.tipo === "saida" &&
      !lancamento.estornado,
  );

  for (const lancamento of lancamentosDaConta) {
    const resultado = estornarLancamentoCaixa(lancamento.id);

    if (!resultado.sucesso) {
      return {
        sucesso: false,
        mensagem:
          resultado.mensagem ??
          `Não foi possível estornar o lançamento ${lancamento.id}.`,
      };
    }
  }

  /*
   * Depois que todos os pagamentos foram estornados,
   * zeramos os valores financeiros da conta.
   *
   * O histórico dos pagamentos permanece preservado.
   */
  const contaEstornada: ContaPagar = {
    ...conta,

    valorPago: 0,

    saldo: conta.valorOriginal,

    pagamentos: conta.pagamentos,

    parcelas: conta.parcelas.map((parcela) => ({
      ...parcela,
      valorPago: 0,
      saldo: parcela.valorOriginal,
      status: "cancelada",
    })),

    status: "cancelada",

    atualizadoEm: agora(),
  };

  contas[indiceConta] = contaEstornada;

  salvarContas(contas);

  return {
    sucesso: true,
    mensagem: "Pagamentos da conta estornados com sucesso.",
    conta: contaEstornada,
  };
}

export function cancelarContaPagar(id: string): {
  sucesso: boolean;
  mensagem: string;
  conta?: ContaPagar;
} {
  const contas = listarContasPagar();

  const indice = contas.findIndex((conta) => conta.id === id);

  if (indice === -1) {
    return {
      sucesso: false,
      mensagem: "Conta a pagar não encontrada.",
    };
  }

  const conta = contas[indice];

  if (conta.status === "paga" || conta.valorPago > 0) {
    return {
      sucesso: false,
      mensagem:
        "Esta conta possui pagamentos. Estorne os pagamentos antes de cancelar a conta.",
    };
  }

  const cancelada: ContaPagar = {
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
    mensagem: "Conta a pagar cancelada com sucesso.",
    conta: cancelada,
  };
}

export function atualizarContasPagarVencidas(): ContaPagar[] {
  const contas = listarContasPagar();

  let alterou = false;

  const atualizadas = contas.map((conta) => {
    if (conta.status === "cancelada" || conta.status === "paga") {
      return conta;
    }

    const atualizada = atualizarStatusConta(conta);

    if (atualizada.status !== conta.status) {
      alterou = true;
    }

    return atualizada;
  });

  if (alterou) {
    salvarContas(atualizadas);
  }

  return atualizadas;
}

export function obterResumoContasPagar() {
  const contas = atualizarContasPagarVencidas();

  const ativas = contas.filter((conta) => conta.status !== "cancelada");

  const valorTotal = arredondar(
    ativas.reduce((total, conta) => total + conta.valorOriginal, 0),
  );

  const valorPago = arredondar(
    ativas.reduce((total, conta) => total + conta.valorPago, 0),
  );

  const saldo = arredondar(
    ativas.reduce((total, conta) => total + conta.saldo, 0),
  );

  return {
    totalContas: contas.length,

    pendentes: contas.filter((conta) => conta.status === "pendente").length,

    parciais: contas.filter((conta) => conta.status === "parcial").length,

    pagas: contas.filter((conta) => conta.status === "paga").length,

    vencidas: contas.filter((conta) => conta.status === "vencida").length,

    canceladas: contas.filter((conta) => conta.status === "cancelada").length,

    valorTotal,

    valorPago,

    saldo,
  };
}

export function buscarContasPagar(termo: string): ContaPagar[] {
  const busca = termo.trim().toLowerCase();

  if (!busca) {
    return listarContasPagar();
  }

  return listarContasPagar().filter((conta) =>
    [
      conta.id,
      conta.compraNumero,
      conta.fornecedorNome,
      conta.descricao,
      conta.formaPagamento,
      conta.status,
      conta.observacao,
    ]
      .filter(Boolean)
      .some((valor) => String(valor).toLowerCase().includes(busca)),
  );
}

export function listarPagamentosContaPagar(
  contaId: string,
): PagamentoContaPagar[] {
  const conta = obterContaPagar(contaId);

  return conta?.pagamentos ?? [];
}
