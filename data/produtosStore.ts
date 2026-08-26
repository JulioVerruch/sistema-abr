import { produtos as produtosIniciais } from "./produtos";

export type StatusProduto = "normal" | "baixo" | "sem-estoque" | "inativo";

export type Produto = {
  id: number;
  nome: string;
  categoria: string;
  codigo: string;
  estoque: number;
  estoqueMinimo?: number;
  custo: string;
  preco: string;
  status: StatusProduto;
  marca?: string;
  unidade?: string;
  observacoes?: string;
  criadoEm?: string;
};

import { obterConfiguracoes } from "./configuracoesStore";

const CHAVE_PRODUTOS = "abr-agro-produtos";

function temJanela() {
  return typeof window !== "undefined";
}

function converterNumeroMoeda(valor: string | number) {
  if (typeof valor === "number") {
    return valor;
  }

  return Number(
    valor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim(),
  );
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function calcularStatusProduto(
  estoque: number,
  estoqueMinimo = obterConfiguracoes().estoque.estoqueMinimoPadrao,
): StatusProduto {
  if (estoque <= 0) {
    return "sem-estoque";
  }

  if (estoque <= estoqueMinimo) {
    return "baixo";
  }

  return "normal";
}

export function obterProdutos(): Produto[] {
  if (!temJanela()) {
    return produtosIniciais as Produto[];
  }

  try {
    const produtosSalvos = localStorage.getItem(CHAVE_PRODUTOS);

    if (!produtosSalvos) {
      localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(produtosIniciais));

      return produtosIniciais as Produto[];
    }

    const produtos = JSON.parse(produtosSalvos);

    if (!Array.isArray(produtos)) {
      return produtosIniciais as Produto[];
    }

    return produtos;
  } catch {
    return produtosIniciais as Produto[];
  }
}

const EVENTO_ATUALIZADO = "abr-agro-produtos-atualizados";

export function salvarProdutos(produtos: Produto[]) {
  localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(produtos));

  window.dispatchEvent(new CustomEvent(EVENTO_ATUALIZADO));
}

export function obterProximoCodigo(): string {
  const produtos = obterProdutos();

  const maiorNumero = produtos.reduce((maior, produto) => {
    const resultado = produto.codigo.match(/^ABR-(\d+)$/);

    if (!resultado) {
      return maior;
    }

    const numero = Number(resultado[1]);

    return numero > maior ? numero : maior;
  }, 0);

  const proximoNumero = maiorNumero + 1;

  return `ABR-${String(proximoNumero).padStart(3, "0")}`;
}

export function obterProximoId(): number {
  const produtos = obterProdutos();

  const maiorId = produtos.reduce((maior, produto) => {
    return produto.id > maior ? produto.id : maior;
  }, 0);

  return maiorId + 1;
}

export type NovoProduto = {
  nome: string;
  categoria: string;
  marca?: string;
  unidade?: string;
  estoque: number;
  estoqueMinimo?: number;
  custo: number;
  preco: number;
  status?: "ativo" | "inativo";
  observacoes?: string;
};

export function adicionarProduto(dados: NovoProduto): Produto {
  const produtos = obterProdutos();

  const codigo = obterProximoCodigo();

  const estoqueMinimo =
    dados.estoqueMinimo ?? obterConfiguracoes().estoque.estoqueMinimoPadrao;

  const produto: Produto = {
    id: obterProximoId(),
    codigo,
    nome: dados.nome.trim(),
    categoria: dados.categoria,
    marca: dados.marca?.trim() || "",
    unidade: dados.unidade || "UN",
    estoque: dados.estoque,
    estoqueMinimo,
    custo: formatarMoeda(converterNumeroMoeda(dados.custo)),
    preco: formatarMoeda(converterNumeroMoeda(dados.preco)),
    status:
      dados.status === "inativo"
        ? "inativo"
        : calcularStatusProduto(dados.estoque, estoqueMinimo),
    observacoes: dados.observacoes?.trim() || "",
    criadoEm: new Date().toISOString(),
  };

  const codigoJaExiste = produtos.some((item) => item.codigo === codigo);

  if (codigoJaExiste) {
    throw new Error("Não foi possível gerar um código único para o produto.");
  }

  const novosProdutos = [...produtos, produto];

  salvarProdutos(novosProdutos);

  return produto;
}

export function atualizarProduto(
  codigo: string,
  dados: Partial<NovoProduto>,
): Produto | null {
  const produtos = obterProdutos();

  const indice = produtos.findIndex((produto) => produto.codigo === codigo);

  if (indice === -1) {
    return null;
  }

  const produtoAtual = produtos[indice];

  const estoque = dados.estoque ?? produtoAtual.estoque;

  const estoqueMinimo =
    dados.estoqueMinimo ??
    produtoAtual.estoqueMinimo ??
    obterConfiguracoes().estoque.estoqueMinimoPadrao;

  const produtoAtualizado: Produto = {
    ...produtoAtual,
    ...dados,

    nome: dados.nome?.trim() || produtoAtual.nome,

    marca: dados.marca?.trim() ?? produtoAtual.marca,

    observacoes: dados.observacoes?.trim() ?? produtoAtual.observacoes,

    estoque,

    estoqueMinimo,

    custo:
      dados.custo !== undefined
        ? formatarMoeda(converterNumeroMoeda(dados.custo))
        : produtoAtual.custo,

    preco:
      dados.preco !== undefined
        ? formatarMoeda(converterNumeroMoeda(dados.preco))
        : produtoAtual.preco,

    status:
      dados.status === "inativo"
        ? "inativo"
        : calcularStatusProduto(estoque, estoqueMinimo),
  };

  const novosProdutos = [...produtos];

  novosProdutos[indice] = produtoAtualizado;

  salvarProdutos(novosProdutos);

  return produtoAtualizado;
}

export function excluirProduto(codigo: string): boolean {
  const produtos = obterProdutos();

  const novosProdutos = produtos.filter((produto) => produto.codigo !== codigo);

  if (novosProdutos.length === produtos.length) {
    return false;
  }

  salvarProdutos(novosProdutos);

  return true;
}
