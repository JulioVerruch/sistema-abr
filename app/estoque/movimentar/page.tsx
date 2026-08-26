"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpFromLine,
  Check,
  ChevronDown,
  Package,
  Save,
  TriangleAlert,
  X,
} from "lucide-react";

import { AppShell } from "../../../components/layout/AppShell";

import { obterProdutos, type Produto } from "../../../data/produtosStore";

import {
  registrarMovimentacao,
  type TipoMovimentacao,
  type MotivoMovimentacao,
} from "../../../data/movimentacoesStore";

type TipoPagina = "entrada" | "saida" | "ajuste";

const tiposValidos: TipoPagina[] = ["entrada", "saida", "ajuste"];

const configuracoes = {
  entrada: {
    titulo: "Registrar entrada",
    descricao:
      "Adicione produtos ao estoque e mantenha o histórico atualizado.",
    icone: ArrowDownToLine,
    classe: "entrada",
  },

  saida: {
    titulo: "Registrar saída",
    descricao:
      "Registre a saída de produtos e atualize o estoque automaticamente.",
    icone: ArrowUpFromLine,
    classe: "saida",
  },

  ajuste: {
    titulo: "Ajustar estoque",
    descricao: "Informe a quantidade real disponível para corrigir o estoque.",
    icone: ArrowLeftRight,
    classe: "ajuste",
  },
};

const motivosPorTipo: Record<
  TipoPagina,
  {
    value: MotivoMovimentacao;
    label: string;
  }[]
> = {
  entrada: [
    {
      value: "compra",
      label: "Compra",
    },
    {
      value: "devolucao",
      label: "Devolução",
    },
    {
      value: "correcao",
      label: "Correção",
    },
    {
      value: "outro",
      label: "Outro",
    },
  ],

  saida: [
    {
      value: "venda",
      label: "Venda",
    },
    {
      value: "perda",
      label: "Perda",
    },
    {
      value: "avaria",
      label: "Avaria",
    },
    {
      value: "devolucao",
      label: "Devolução",
    },
    {
      value: "outro",
      label: "Outro",
    },
  ],

  ajuste: [
    {
      value: "correcao",
      label: "Correção de inventário",
    },
    {
      value: "perda",
      label: "Perda identificada",
    },
    {
      value: "avaria",
      label: "Avaria identificada",
    },
    {
      value: "outro",
      label: "Outro ajuste",
    },
  ],
};

export default function MovimentarEstoquePage() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const tipoUrl = searchParams.get("tipo") || "entrada";

  const produtoUrl = searchParams.get("produto") || "";

  const tipo: TipoPagina = tiposValidos.includes(tipoUrl as TipoPagina)
    ? (tipoUrl as TipoPagina)
    : "entrada";

  const config = configuracoes[tipo];

  const IconeTipo = config.icone;

  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [codigoProduto, setCodigoProduto] = useState("");

  const [quantidade, setQuantidade] = useState("");

  const [motivo, setMotivo] = useState<MotivoMovimentacao>(
    motivosPorTipo[tipo][0].value,
  );

  const [observacao, setObservacao] = useState("");

  const [processando, setProcessando] = useState(false);

  const [erro, setErro] = useState("");

  const [sucesso, setSucesso] = useState("");

  /* =========================================================
     CARREGAR PRODUTOS
  ========================================================= */

  const carregarProdutos = () => {
    const lista = obterProdutos();

    setProdutos(lista);

    return lista;
  };

  useEffect(() => {
    const lista = carregarProdutos();

    if (produtoUrl) {
      const produtoExiste = lista.some(
        (produto) =>
          produto.codigo === produtoUrl && produto.status !== "inativo",
      );

      if (produtoExiste) {
        setCodigoProduto(produtoUrl);
      }
    }
  }, [produtoUrl]);

  /* =========================================================
     ATUALIZAÇÃO DO TIPO
  ========================================================= */

  useEffect(() => {
    setMotivo(motivosPorTipo[tipo][0].value);

    setQuantidade("");

    setErro("");
  }, [tipo]);

  /* =========================================================
     PRODUTO SELECIONADO
  ========================================================= */

  const produtoSelecionado = useMemo(() => {
    return produtos.find((produto) => produto.codigo === codigoProduto) || null;
  }, [produtos, codigoProduto]);

  const quantidadeNumerica = Number(quantidade) || 0;

  const estoqueAtual = produtoSelecionado?.estoque || 0;

  /* =========================================================
     ESTOQUE RESULTANTE
  ========================================================= */

  const estoqueResultante = useMemo(() => {
    if (!produtoSelecionado) {
      return 0;
    }

    if (tipo === "entrada") {
      return estoqueAtual + quantidadeNumerica;
    }

    if (tipo === "saida") {
      return estoqueAtual - quantidadeNumerica;
    }

    return quantidadeNumerica;
  }, [produtoSelecionado, tipo, estoqueAtual, quantidadeNumerica]);

  const diferencaAjuste =
    tipo === "ajuste" ? estoqueResultante - estoqueAtual : 0;

  /* =========================================================
     VALIDAÇÃO
  ========================================================= */

  const quantidadeValida =
    tipo === "ajuste"
      ? quantidade !== "" && quantidadeNumerica >= 0
      : quantidadeNumerica > 0;

  const estoqueSuficiente =
    tipo !== "saida" || quantidadeNumerica <= estoqueAtual;

  const podeSalvar =
    !!produtoSelecionado &&
    quantidadeValida &&
    estoqueSuficiente &&
    !processando;

  /* =========================================================
     SALVAR MOVIMENTAÇÃO
  ========================================================= */

  const salvarMovimentacao = () => {
    setErro("");

    setSucesso("");

    if (!produtoSelecionado) {
      setErro("Selecione um produto.");

      return;
    }

    if (tipo !== "ajuste" && quantidadeNumerica <= 0) {
      setErro("Informe uma quantidade válida.");

      return;
    }

    if (tipo === "saida" && quantidadeNumerica > estoqueAtual) {
      setErro(`Estoque insuficiente. Disponível: ${estoqueAtual} unidade(s).`);

      return;
    }

    if (tipo === "ajuste" && quantidade === "") {
      setErro("Informe a quantidade final em estoque.");

      return;
    }

    try {
      setProcessando(true);

      registrarMovimentacao({
        codigoProduto: produtoSelecionado.codigo,

        tipo: tipo as TipoMovimentacao,

        motivo,

        quantidade: quantidadeNumerica,

        observacao: observacao.trim(),

        estoqueFinal: tipo === "ajuste" ? quantidadeNumerica : undefined,
      });

      carregarProdutos();

      setSucesso(
        tipo === "entrada"
          ? "Entrada registrada com sucesso."
          : tipo === "saida"
            ? "Saída registrada com sucesso."
            : "Estoque ajustado com sucesso.",
      );

      setQuantidade("");

      setObservacao("");

      /*
        Aguarda o usuário visualizar
        a confirmação e retorna ao estoque.
      */

      window.setTimeout(() => {
        router.push("/estoque");
      }, 1200);
    } catch (error) {
      console.error("Erro ao registrar movimentação:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a movimentação.",
      );
    } finally {
      setProcessando(false);
    }
  };

  return (
    <AppShell title={config.titulo} description={config.descricao}>
      <section className="admin-page">
        {/* =====================================================
            MENSAGEM DE SUCESSO
        ===================================================== */}

        {sucesso && (
          <div className="system-toast success">
            <div className="system-toast-icon">
              <Check size={17} />
            </div>

            <span>{sucesso}</span>

            <button
              type="button"
              onClick={() => {
                setSucesso("");
              }}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* =====================================================
            CABEÇALHO
        ===================================================== */}

        <div className="admin-page-header">
          <div>
            <Link href="/estoque" className="back-link">
              <ArrowLeft size={17} />
              Voltar para estoque
            </Link>

            <span className="admin-eyebrow">CONTROLE DE ESTOQUE</span>

            <h2>{config.titulo}</h2>

            <p>{config.descricao}</p>
          </div>

          <div className={`stock-operation-badge ${config.classe}`}>
            <IconeTipo size={22} />

            <span>
              {tipo === "entrada"
                ? "Entrada"
                : tipo === "saida"
                  ? "Saída"
                  : "Ajuste"}
            </span>
          </div>
        </div>

        {/* =====================================================
            CONTEÚDO
        ===================================================== */}

        <div className="stock-operation-layout">
          {/* FORMULÁRIO */}

          <article className="admin-card stock-operation-form">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">MOVIMENTAÇÃO</span>

                <h3>Informações da operação</h3>

                <p>Preencha os dados abaixo para registrar a movimentação.</p>
              </div>
            </div>

            {erro && (
              <div className="form-error-message">
                <TriangleAlert size={18} />

                <span>{erro}</span>

                <button
                  type="button"
                  onClick={() => {
                    setErro("");
                  }}
                  aria-label="Fechar erro"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            <div className="admin-form-grid">
              {/* PRODUTO */}

              <label className="admin-field full">
                <span>Produto *</span>

                <div className="select-wrapper">
                  <Package size={18} />

                  <select
                    value={codigoProduto}
                    onChange={(event) => {
                      setCodigoProduto(event.target.value);

                      setErro("");
                    }}
                  >
                    <option value="">Selecione um produto</option>

                    {produtos
                      .filter((produto) => produto.status !== "inativo")
                      .map((produto) => (
                        <option key={produto.id} value={produto.codigo}>
                          {produto.codigo}
                          {" — "}
                          {produto.nome}
                        </option>
                      ))}
                  </select>

                  <ChevronDown size={17} />
                </div>
              </label>

              {/* QUANTIDADE */}

              <label className="admin-field">
                <span>
                  {tipo === "ajuste" ? "Estoque final *" : "Quantidade *"}
                </span>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={quantidade}
                  placeholder={
                    tipo === "ajuste"
                      ? "Informe o estoque real"
                      : "Digite a quantidade"
                  }
                  onChange={(event) => {
                    setQuantidade(event.target.value);

                    setErro("");
                  }}
                />
              </label>

              {/* MOTIVO */}

              <label className="admin-field">
                <span>Motivo *</span>

                <div className="select-wrapper">
                  <select
                    value={motivo}
                    onChange={(event) =>
                      setMotivo(event.target.value as MotivoMovimentacao)
                    }
                  >
                    {motivosPorTipo[tipo].map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <ChevronDown size={17} />
                </div>
              </label>

              {/* OBSERVAÇÃO */}

              <label className="admin-field full">
                <span>Observação</span>

                <textarea
                  value={observacao}
                  placeholder="Adicione uma observação sobre esta movimentação..."
                  rows={4}
                  onChange={(event) => setObservacao(event.target.value)}
                />
              </label>
            </div>

            {/* AÇÕES */}

            <div className="stock-operation-actions">
              <Link href="/estoque" className="btn">
                Cancelar
              </Link>

              <button
                type="button"
                className={`btn primary stock-save-btn ${config.classe}`}
                disabled={!podeSalvar}
                onClick={salvarMovimentacao}
              >
                <Save size={18} />

                {processando
                  ? "Registrando..."
                  : tipo === "entrada"
                    ? "Registrar entrada"
                    : tipo === "saida"
                      ? "Registrar saída"
                      : "Salvar ajuste"}
              </button>
            </div>
          </article>

          {/* =================================================
              PAINEL LATERAL
          ================================================= */}

          <aside className="stock-operation-sidebar">
            {/* RESUMO */}

            <article className="admin-card stock-product-preview">
              <div className="admin-card-header">
                <div>
                  <span className="admin-eyebrow">PRODUTO</span>

                  <h3>Resumo do estoque</h3>
                </div>
              </div>

              {produtoSelecionado ? (
                <>
                  <div className="stock-preview-product">
                    <div className="stock-preview-icon">
                      <Package size={24} />
                    </div>

                    <div>
                      <strong>{produtoSelecionado.nome}</strong>

                      <span>{produtoSelecionado.codigo}</span>
                    </div>
                  </div>

                  <div className="stock-preview-numbers">
                    <div>
                      <span>Estoque atual</span>

                      <strong>{estoqueAtual}</strong>
                    </div>

                    <div>
                      <span>
                        {tipo === "ajuste" ? "Novo estoque" : "Resultado"}
                      </span>

                      <strong
                        className={
                          estoqueResultante < 0
                            ? "text-red"
                            : tipo === "saida"
                              ? "text-gold"
                              : "text-green"
                        }
                      >
                        {estoqueResultante}
                      </strong>
                    </div>
                  </div>

                  {tipo === "ajuste" && (
                    <div className="stock-adjustment-info">
                      <ArrowLeftRight size={17} />

                      <span>
                        Diferença:{" "}
                        <strong
                          className={
                            diferencaAjuste < 0
                              ? "text-red"
                              : diferencaAjuste > 0
                                ? "text-green"
                                : ""
                          }
                        >
                          {diferencaAjuste > 0 ? "+" : ""}

                          {diferencaAjuste}
                        </strong>
                      </span>
                    </div>
                  )}

                  {tipo === "saida" && quantidadeNumerica > estoqueAtual && (
                    <div className="stock-insufficient-warning">
                      <TriangleAlert size={18} />

                      <span>Quantidade maior que o estoque disponível.</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state compact">
                  <Package size={32} />

                  <strong>Nenhum produto selecionado</strong>

                  <span>
                    Selecione um produto para visualizar o estoque atual.
                  </span>
                </div>
              )}
            </article>

            {/* AJUDA */}

            <article className="admin-card stock-operation-help">
              <div className="stock-help-icon">
                <IconeTipo size={21} />
              </div>

              <div>
                <strong>
                  {tipo === "entrada"
                    ? "Como funciona a entrada?"
                    : tipo === "saida"
                      ? "Como funciona a saída?"
                      : "Como funciona o ajuste?"}
                </strong>

                <p>
                  {tipo === "entrada" &&
                    "A quantidade informada será adicionada ao estoque atual do produto."}

                  {tipo === "saida" &&
                    "A quantidade informada será descontada do estoque atual. O sistema não permite estoque negativo."}

                  {tipo === "ajuste" &&
                    "Informe a quantidade real disponível. O sistema registrará automaticamente a diferença."}
                </p>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
