/**
 * Configurações do Sistema ABR
 *
 * Store local de configurações da empresa/operação.
 * Não altera automaticamente os módulos existentes:
 * eles devem consumir estas configurações em etapas específicas.
 */

export type DadosEmpresa = {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  telefone: string;
  email: string;
  site: string;
  logoUrl: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

export type ConfigComercial = {
  prefixoVenda: string;
  proximoNumeroVenda: number;
  prefixoCompra: string;
  proximoNumeroCompra: number;
  descontoMaximoPercentual: number;
  exigirClienteVenda: boolean;
  permitirVendaSemEstoque: boolean;
  formasPagamento: string[];
  condicoesPagamento: string[];
};

export type ConfigFinanceira = {
  moeda: "BRL";
  prazoPadraoReceberDias: number;
  prazoPadraoPagarDias: number;
  jurosAoDiaPercentual: number;
  multaPercentual: number;
  caixaPrincipalNome: string;
};

export type ConfigEstoque = {
  estoqueMinimoPadrao: number;
  estoqueMaximoPadrao: number;
  alertarEstoqueBaixo: boolean;
  permitirEstoqueNegativo: boolean;
  casasDecimaisQuantidade: number;
};

export type ConfiguracoesSistema = {
  empresa: DadosEmpresa;
  comercial: ConfigComercial;
  financeira: ConfigFinanceira;
  estoque: ConfigEstoque;
  atualizadoEm: string;
};

const STORAGE_KEY = "abr-agro-configuracoes";
const EVENTO_ATUALIZADO = "abr-agro-configuracoes-atualizadas";

export const configuracoesPadrao: ConfiguracoesSistema = {
  empresa: {
    razaoSocial: "",
    nomeFantasia: "ABR Agro",
    cnpj: "",
    inscricaoEstadual: "",
    telefone: "",
    email: "",
    site: "",
    logoUrl: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "MT",
  },
  comercial: {
    prefixoVenda: "V",
    proximoNumeroVenda: 1,
    prefixoCompra: "C",
    proximoNumeroCompra: 1,
    descontoMaximoPercentual: 10,
    exigirClienteVenda: true,
    permitirVendaSemEstoque: false,
    formasPagamento: [
      "pix",
      "dinheiro",
      "cartao_credito",
      "cartao_debito",
      "transferencia",
      "boleto",
      "outro",
    ],
    condicoesPagamento: ["A vista", "7 dias", "14 dias", "28 dias"],
  },
  financeira: {
    moeda: "BRL",
    prazoPadraoReceberDias: 0,
    prazoPadraoPagarDias: 28,
    jurosAoDiaPercentual: 0,
    multaPercentual: 0,
    caixaPrincipalNome: "Caixa principal",
  },
  estoque: {
    estoqueMinimoPadrao: 5,
    estoqueMaximoPadrao: 100,
    alertarEstoqueBaixo: true,
    permitirEstoqueNegativo: false,
    casasDecimaisQuantidade: 0,
  },
  atualizadoEm: "",
};

function clonarPadrao(): ConfiguracoesSistema {
  return JSON.parse(JSON.stringify(configuracoesPadrao));
}

function mesclarConfiguracoes(
  atual: Partial<ConfiguracoesSistema> | null,
): ConfiguracoesSistema {
  const padrao = clonarPadrao();

  return {
    ...padrao,
    ...(atual ?? {}),
    empresa: {
      ...padrao.empresa,
      ...(atual?.empresa ?? {}),
    },
    comercial: {
      ...padrao.comercial,
      ...(atual?.comercial ?? {}),
      formasPagamento: atual?.comercial?.formasPagamento?.length
        ? [...atual.comercial.formasPagamento]
        : [...padrao.comercial.formasPagamento],
      condicoesPagamento: atual?.comercial?.condicoesPagamento?.length
        ? [...atual.comercial.condicoesPagamento]
        : [...padrao.comercial.condicoesPagamento],
    },
    financeira: {
      ...padrao.financeira,
      ...(atual?.financeira ?? {}),
    },
    estoque: {
      ...padrao.estoque,
      ...(atual?.estoque ?? {}),
    },
  };
}

function ler(): ConfiguracoesSistema {
  if (typeof window === "undefined") {
    return clonarPadrao();
  }

  try {
    const bruto = window.localStorage.getItem(STORAGE_KEY);

    if (!bruto) {
      return clonarPadrao();
    }

    return mesclarConfiguracoes(
      JSON.parse(bruto) as Partial<ConfiguracoesSistema>,
    );
  } catch {
    return clonarPadrao();
  }
}

function salvar(configuracoes: ConfiguracoesSistema): ConfiguracoesSistema {
  const resultado: ConfiguracoesSistema = {
    ...mesclarConfiguracoes(configuracoes),
    atualizadoEm: new Date().toISOString(),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resultado));

  window.dispatchEvent(
    new CustomEvent(EVENTO_ATUALIZADO, {
      detail: resultado,
    }),
  );

  return resultado;
}

export function obterConfiguracoes(): ConfiguracoesSistema {
  return ler();
}

export function salvarConfiguracoes(
  configuracoes: ConfiguracoesSistema,
): ConfiguracoesSistema {
  return salvar(configuracoes);
}

export function restaurarConfiguracoesPadrao(): ConfiguracoesSistema {
  const resultado = salvar(clonarPadrao());
  return resultado;
}

export function atualizarConfiguracoes(
  alteracoes: Partial<ConfiguracoesSistema>,
): ConfiguracoesSistema {
  return salvar(
    mesclarConfiguracoes({
      ...ler(),
      ...alteracoes,
    }),
  );
}

export { STORAGE_KEY, EVENTO_ATUALIZADO };
