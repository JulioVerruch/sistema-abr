import { atualizarProduto, obterProdutos, type Produto } from "./produtosStore";
import { obterConfiguracoes } from "./configuracoesStore";

/* ========================================
   TIPOS DE MOVIMENTAÇÃO
======================================== */

export type TipoMovimentacao = "entrada" | "saida" | "ajuste" | "estorno";

export type MotivoMovimentacao =
  | "compra"
  | "venda"
  | "devolucao"
  | "perda"
  | "avaria"
  | "correcao"
  | "outro"
  | "estorno";

/* ========================================
   INTERFACE DA MOVIMENTAÇÃO
======================================== */

export interface MovimentacaoEstoque {
  id: string;

  produtoId: string;
  produtoCodigo: string;
  produtoNome: string;

  tipo: TipoMovimentacao;
  motivo: MotivoMovimentacao;

  quantidade: number;

  /*
     Estoque antes da movimentação.
  */
  estoqueAnterior: number;

  /*
     Estoque após a movimentação.
  */
  estoqueAtual: number;

  observacao: string;

  data: string;

  criadoEm: string;

  /*
     Controle de estorno.
  */

  estornada?: boolean;

  estornadaEm?: string;

  estornoId?: string;

  /*
     Utilizado apenas nas movimentações
     criadas automaticamente pelo estorno.
  */
  movimentacaoOriginalId?: string;

  /*
     Referência opcional à venda que originou
     a movimentação de estoque.
  */
  vendaId?: string;
  vendaNumero?: string;

  compraId?: string;
  compraNumero?: string;
}

/* ========================================
   CHAVE DO LOCALSTORAGE
======================================== */

const STORAGE_KEY = "abr-agro-movimentacoes";

/* ========================================
   OBTER MOVIMENTAÇÕES
======================================== */

export function obterMovimentacoes(): MovimentacaoEstoque[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const movimentacoesSalvas = localStorage.getItem(STORAGE_KEY);

    if (!movimentacoesSalvas) {
      return [];
    }

    const movimentacoes = JSON.parse(movimentacoesSalvas);

    if (!Array.isArray(movimentacoes)) {
      return [];
    }

    return movimentacoes;
  } catch (error) {
    console.error("Erro ao carregar movimentações:", error);

    return [];
  }
}

/* ========================================
   SALVAR MOVIMENTAÇÕES
======================================== */

function salvarMovimentacoes(movimentacoes: MovimentacaoEstoque[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(movimentacoes));

  /*
     Dispara um evento para que outras
     partes do sistema possam reagir
     às alterações.
  */

  window.dispatchEvent(
    new CustomEvent("abr-agro-movimentacoes-atualizadas", {
      detail: movimentacoes,
    }),
  );
}

/* ========================================
   GERAR ID ÚNICO
======================================== */

function gerarIdMovimentacao() {
  return `MOV-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;
}

/* ========================================
   BUSCAR PRODUTO
======================================== */

export function obterProdutoPorCodigo(codigo: string): Produto | null {
  const produtos = obterProdutos();

  const produto = produtos.find((item) => item.codigo === codigo);

  return produto || null;
}

/* ========================================
   REGISTRAR MOVIMENTAÇÃO
======================================== */

interface RegistrarMovimentacaoParams {
  codigoProduto: string;

  tipo: Exclude<TipoMovimentacao, "estorno">;

  motivo: Exclude<MotivoMovimentacao, "estorno">;

  quantidade: number;

  observacao?: string;

  /*
     Utilizado principalmente
     para ajustes de estoque.
  */
  estoqueFinal?: number;

  /*
     Referência opcional da venda que originou
     a movimentação.
  */
  vendaId?: string;
  vendaNumero?: string;

  compraId?: string;
  compraNumero?: string;
}

export function registrarMovimentacao(
  params: RegistrarMovimentacaoParams,
): MovimentacaoEstoque {
  const {
    codigoProduto,
    tipo,
    motivo,
    quantidade,
    observacao = "",
    estoqueFinal,
    vendaId,
    vendaNumero,
    compraId,
    compraNumero,
  } = params;

  /* ================================
     VALIDAÇÕES
  ================================= */

  if (!codigoProduto) {
    throw new Error("Selecione um produto.");
  }

  if (!tipo) {
    throw new Error("Selecione o tipo da movimentação.");
  }

  if (!motivo) {
    throw new Error("Selecione o motivo da movimentação.");
  }

  const produto = obterProdutoPorCodigo(codigoProduto);

  if (!produto) {
    throw new Error("Produto não encontrado.");
  }

  const estoqueAnterior = Number(produto.estoque) || 0;

  let novoEstoque = estoqueAnterior;

  /* ================================
     ENTRADA
  ================================= */

  if (tipo === "entrada") {
    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      throw new Error("Informe uma quantidade válida para entrada.");
    }

    novoEstoque = estoqueAnterior + quantidade;
  }

  /* ================================
     SAÍDA
  ================================= */

  if (tipo === "saida") {
    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      throw new Error("Informe uma quantidade válida para saída.");
    }

    if (
      quantidade > estoqueAnterior &&
      !obterConfiguracoes().estoque.permitirEstoqueNegativo
    ) {
      throw new Error(
        `Estoque insuficiente. Disponível: ${estoqueAnterior} unidade(s).`,
      );
    }

    novoEstoque = estoqueAnterior - quantidade;
  }

  /* ================================
     AJUSTE
  ================================= */

  if (tipo === "ajuste") {
    if (
      estoqueFinal === undefined ||
      !Number.isFinite(estoqueFinal) ||
      estoqueFinal < 0
    ) {
      throw new Error("Informe o estoque final para realizar o ajuste.");
    }

    novoEstoque = estoqueFinal;
  }

  /* ================================
     ATUALIZAR PRODUTO
  ================================= */

  const produtoAtualizado = atualizarProduto(codigoProduto, {
    estoque: novoEstoque,
  });

  if (!produtoAtualizado) {
    throw new Error("Não foi possível atualizar o estoque do produto.");
  }

  /* ================================
     CRIAR MOVIMENTAÇÃO
  ================================= */

  const agora = new Date().toISOString();

  const movimentacao: MovimentacaoEstoque = {
    id: gerarIdMovimentacao(),

    produtoId: produto.id,

    produtoCodigo: produto.codigo,

    produtoNome: produto.nome,

    tipo,

    motivo,

    quantidade:
      tipo === "ajuste" ? Math.abs(novoEstoque - estoqueAnterior) : quantidade,

    estoqueAnterior,

    estoqueAtual: novoEstoque,

    observacao: observacao.trim(),

    data: agora,

    criadoEm: agora,

    estornada: false,

    vendaId,
    vendaNumero,
    compraId,
    compraNumero,
  };

  const movimentacoes = obterMovimentacoes();

  /*
     A movimentação mais recente
     ficará no início da lista.
  */

  movimentacoes.unshift(movimentacao);

  salvarMovimentacoes(movimentacoes);

  /*
     Evento para atualização
     imediata do estoque no sistema.
  */

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("abr-agro-estoque-atualizado", {
        detail: {
          produtoCodigo: codigoProduto,

          estoqueAnterior,

          estoqueAtual: novoEstoque,
        },
      }),
    );
  }

  return movimentacao;
}

/* ========================================
   ESTORNAR MOVIMENTAÇÃO
======================================== */

export function estornarMovimentacao(id: string): MovimentacaoEstoque {
  const movimentacoes = obterMovimentacoes();

  const indiceOriginal = movimentacoes.findIndex((item) => item.id === id);

  if (indiceOriginal === -1) {
    throw new Error("Movimentação não encontrada.");
  }

  const movimentacaoOriginal = movimentacoes[indiceOriginal];

  /*
     Não é permitido estornar
     uma movimentação de estorno.
  */

  if (movimentacaoOriginal.tipo === "estorno") {
    throw new Error("Uma movimentação de estorno não pode ser estornada.");
  }

  /*
     Impede estorno duplicado.
  */

  if (movimentacaoOriginal.estornada) {
    throw new Error("Esta movimentação já foi estornada.");
  }

  const produto = obterProdutoPorCodigo(movimentacaoOriginal.produtoCodigo);

  if (!produto) {
    throw new Error("Produto relacionado à movimentação não foi encontrado.");
  }

  const estoqueAnterior = Number(produto.estoque) || 0;

  let novoEstoque = estoqueAnterior;

  /*
     INVERTER A MOVIMENTAÇÃO ORIGINAL
  */

  if (movimentacaoOriginal.tipo === "entrada") {
    /*
       Para desfazer uma entrada,
       precisamos retirar a quantidade.
    */

    if (movimentacaoOriginal.quantidade > estoqueAnterior) {
      throw new Error(
        `Não é possível estornar esta entrada porque o estoque atual (${estoqueAnterior}) é menor que a quantidade original (${movimentacaoOriginal.quantidade}).`,
      );
    }

    novoEstoque = estoqueAnterior - movimentacaoOriginal.quantidade;
  }

  if (movimentacaoOriginal.tipo === "saida") {
    /*
       Para desfazer uma saída,
       devolvemos a quantidade ao estoque.
    */

    novoEstoque = estoqueAnterior + movimentacaoOriginal.quantidade;
  }

  if (movimentacaoOriginal.tipo === "ajuste") {
    /*
       Para desfazer um ajuste,
       retornamos ao estoque que existia
       antes da movimentação original.
    */

    novoEstoque = movimentacaoOriginal.estoqueAnterior;
  }

  /*
     Atualizar estoque do produto.
  */

  const produtoAtualizado = atualizarProduto(
    movimentacaoOriginal.produtoCodigo,
    {
      estoque: novoEstoque,
    },
  );

  if (!produtoAtualizado) {
    throw new Error("Não foi possível atualizar o estoque durante o estorno.");
  }

  const agora = new Date().toISOString();

  const estorno: MovimentacaoEstoque = {
    id: gerarIdMovimentacao(),

    produtoId: movimentacaoOriginal.produtoId,

    produtoCodigo: movimentacaoOriginal.produtoCodigo,

    produtoNome: movimentacaoOriginal.produtoNome,

    tipo: "estorno",

    motivo: "estorno",

    quantidade: movimentacaoOriginal.quantidade,

    estoqueAnterior,

    estoqueAtual: novoEstoque,

    observacao: `Estorno da movimentação ${movimentacaoOriginal.id}.`,

    data: agora,

    criadoEm: agora,

    movimentacaoOriginalId: movimentacaoOriginal.id,

    vendaId: movimentacaoOriginal.vendaId,
    vendaNumero: movimentacaoOriginal.vendaNumero,

    compraId: movimentacaoOriginal.compraId,
    compraNumero: movimentacaoOriginal.compraNumero,
  };

  /*
     Atualizar movimentação original.
  */

  movimentacoes[indiceOriginal] = {
    ...movimentacaoOriginal,

    estornada: true,

    estornadaEm: agora,

    estornoId: estorno.id,
  };

  /*
     O estorno aparece no início
     do histórico.
  */

  movimentacoes.unshift(estorno);

  salvarMovimentacoes(movimentacoes);

  /*
     Evento de atualização
     do estoque.
  */

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("abr-agro-estoque-atualizado", {
        detail: {
          produtoCodigo: movimentacaoOriginal.produtoCodigo,

          estoqueAnterior,

          estoqueAtual: novoEstoque,

          movimentacaoOriginalId: movimentacaoOriginal.id,

          estornoId: estorno.id,
        },
      }),
    );
  }

  return estorno;
}

/* ========================================
   MOVIMENTAÇÕES POR PRODUTO
======================================== */

export function obterMovimentacoesPorProduto(
  codigoProduto: string,
): MovimentacaoEstoque[] {
  return obterMovimentacoes().filter(
    (movimentacao) => movimentacao.produtoCodigo === codigoProduto,
  );
}

/* ========================================
   MOVIMENTAÇÃO POR ID
======================================== */

export function obterMovimentacaoPorId(id: string): MovimentacaoEstoque | null {
  const movimentacoes = obterMovimentacoes();

  const movimentacao = movimentacoes.find((item) => item.id === id);

  return movimentacao || null;
}

/* ========================================
   RESUMO DAS MOVIMENTAÇÕES
======================================== */

export function obterResumoMovimentacoes() {
  const movimentacoes = obterMovimentacoes();

  const entradas = movimentacoes.filter((item) => item.tipo === "entrada");

  const saidas = movimentacoes.filter((item) => item.tipo === "saida");

  const ajustes = movimentacoes.filter((item) => item.tipo === "ajuste");

  const estornos = movimentacoes.filter((item) => item.tipo === "estorno");

  const totalEntradas = entradas.reduce(
    (total, item) => total + item.quantidade,
    0,
  );

  const totalSaidas = saidas.reduce(
    (total, item) => total + item.quantidade,
    0,
  );

  return {
    totalMovimentacoes: movimentacoes.length,

    totalEntradas: entradas.length,

    totalSaidas: saidas.length,

    totalAjustes: ajustes.length,

    totalEstornos: estornos.length,

    quantidadeEntrada: totalEntradas,

    quantidadeSaida: totalSaidas,
  };
}

/* ========================================
   EXCLUIR HISTÓRICO
======================================== */

export function excluirMovimentacao(id: string): boolean {
  const movimentacoes = obterMovimentacoes();

  const movimentacaoExiste = movimentacoes.some((item) => item.id === id);

  if (!movimentacaoExiste) {
    return false;
  }

  const movimentacoesAtualizadas = movimentacoes.filter(
    (item) => item.id !== id,
  );

  salvarMovimentacoes(movimentacoesAtualizadas);

  return true;
}
