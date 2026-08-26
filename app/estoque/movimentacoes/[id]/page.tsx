"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  RotateCcw,
  Package,
  Calendar,
  Clock,
  FileText,
  Hash,
  Boxes,
  ArrowRight,
  Info,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

import {
  obterMovimentacaoPorId,
  estornarMovimentacao,
  type MovimentacaoEstoque,
} from "@/data/movimentacoesStore";

function formatarDataHora(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(data));
}

function obterNomeMotivo(motivo: string) {
  const motivos: Record<string, string> = {
    compra: "Compra",
    venda: "Venda",
    devolucao: "Devolução",
    perda: "Perda",
    avaria: "Avaria",
    correcao: "Correção",
    outro: "Outro",
    estorno: "Estorno",
  };

  return motivos[motivo] || motivo;
}

export default function DetalhesMovimentacaoPage() {
  const params = useParams();
  const router = useRouter();

  const [movimentacao, setMovimentacao] = useState<MovimentacaoEstoque | null>(
    null,
  );

  const [carregando, setCarregando] = useState(true);

  const [confirmarEstorno, setConfirmarEstorno] = useState(false);

  const [estornando, setEstornando] = useState(false);

  const [erro, setErro] = useState("");

  const [sucesso, setSucesso] = useState("");

  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";

  function carregarMovimentacao() {
    if (!id) {
      setMovimentacao(null);
      setCarregando(false);
      return;
    }

    const movimentacaoEncontrada = obterMovimentacaoPorId(id);

    setMovimentacao(movimentacaoEncontrada);

    setCarregando(false);
  }

  useEffect(() => {
    carregarMovimentacao();
  }, [id]);

  function cancelarEstorno() {
    setConfirmarEstorno(false);
    setErro("");
  }

  function abrirConfirmacaoEstorno() {
    setErro("");
    setConfirmarEstorno(true);
  }

  function confirmarEstornoMovimentacao() {
    if (!movimentacao) {
      return;
    }

    setEstornando(true);
    setErro("");
    setSucesso("");

    try {
      const estorno = estornarMovimentacao(movimentacao.id);

      setConfirmarEstorno(false);

      setSucesso(
        `Movimentação estornada com sucesso. Estorno criado: ${estorno.id}`,
      );

      carregarMovimentacao();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível realizar o estorno.",
      );
    } finally {
      setEstornando(false);
    }
  }

  if (carregando) {
    return (
      <main className="admin-page movimentacao-detalhes-page">
        <div className="movimentacao-loading">Carregando movimentação...</div>
      </main>
    );
  }

  if (!movimentacao) {
    return (
      <main className="admin-page movimentacao-detalhes-page">
        <div className="movimentacao-not-found">
          <div className="movimentacao-not-found-icon">
            <Package size={32} />
          </div>

          <h1>Movimentação não encontrada</h1>

          <p>
            Não foi possível encontrar essa movimentação no histórico do
            estoque.
          </p>

          <Link href="/estoque/movimentacoes" className="admin-button primary">
            <ArrowLeft size={18} />
            Voltar para movimentações
          </Link>
        </div>
      </main>
    );
  }

  const tipoConfig =
    movimentacao.tipo === "entrada"
      ? {
          nome: "Entrada",
          descricao: "Produtos adicionados ao estoque.",
          Icon: ArrowDownToLine,
        }
      : movimentacao.tipo === "saida"
        ? {
            nome: "Saída",
            descricao: "Produtos retirados do estoque.",
            Icon: ArrowUpFromLine,
          }
        : movimentacao.tipo === "ajuste"
          ? {
              nome: "Ajuste",
              descricao: "Quantidade corrigida manualmente.",
              Icon: ArrowLeftRight,
            }
          : {
              nome: "Estorno",
              descricao: "Movimentação criada para desfazer uma operação.",
              Icon: RotateCcw,
            };

  const IconeTipo = tipoConfig.Icon;

  const diferenca = movimentacao.estoqueAtual - movimentacao.estoqueAnterior;

  const diferencaPositiva = diferenca > 0;

  const diferencaNegativa = diferenca < 0;

  const podeEstornar =
    movimentacao.tipo !== "estorno" && !movimentacao.estornada;

  const possuiOrigemVenda = Boolean(
    movimentacao.vendaId || movimentacao.vendaNumero,
  );

  const vendaHref = movimentacao.vendaId
    ? `/vendas/${movimentacao.vendaId}`
    : null;

  return (
    <main className="admin-page movimentacao-detalhes-page">
      <div className="movimentacao-details-container">
        {/* BOTÃO VOLTAR */}

        <button
          type="button"
          className="movimentacao-back-button"
          onClick={() => router.push("/estoque/movimentacoes")}
        >
          <ArrowLeft size={18} />
          Voltar para movimentações
        </button>

        {/* CABEÇALHO */}

        <header className="movimentacao-details-header">
          <div className="movimentacao-details-title">
            <span className="admin-eyebrow">Movimentação de estoque</span>

            <div className="movimentacao-title-row">
              <h1>Detalhes da movimentação</h1>

              {movimentacao.estornada && (
                <span className="movimentacao-status estornada">
                  <CheckCircle2 size={16} />
                  Estornada
                </span>
              )}

              {movimentacao.tipo === "estorno" && (
                <span className="movimentacao-status estorno">
                  <RotateCcw size={16} />
                  Estorno
                </span>
              )}
            </div>

            <p>
              Consulte todas as informações relacionadas a esta movimentação.
            </p>
          </div>

          <div className={`movimentacao-type-badge ${movimentacao.tipo}`}>
            <IconeTipo size={18} />

            <div>
              <strong>{tipoConfig.nome}</strong>

              <span>{tipoConfig.descricao}</span>
            </div>
          </div>
        </header>

        {/* ALERTA DE SUCESSO */}

        {sucesso && (
          <div className="movimentacao-feedback success">
            <CheckCircle2 size={19} />

            <div>
              <strong>Estorno realizado</strong>

              <span>{sucesso}</span>
            </div>
          </div>
        )}

        {/* ALERTA DE ERRO */}

        {erro && !confirmarEstorno && (
          <div className="movimentacao-feedback error">
            <AlertTriangle size={19} />

            <div>
              <strong>Não foi possível concluir</strong>

              <span>{erro}</span>
            </div>
          </div>
        )}

        {/* IDENTIFICADOR */}

        <div className="movimentacao-id-bar">
          <div>
            <Hash size={17} />

            <span>Identificador da movimentação</span>
          </div>

          <strong>{movimentacao.id}</strong>
        </div>

        {/* AÇÕES */}

        <section className="movimentacao-actions">
          {podeEstornar && (
            <button
              type="button"
              className="movimentacao-estornar-button"
              onClick={abrirConfirmacaoEstorno}
            >
              <RotateCcw size={18} />
              Estornar movimentação
            </button>
          )}

          {movimentacao.estornada && movimentacao.estornoId && (
            <Link
              href={`/estoque/movimentacoes/${movimentacao.estornoId}`}
              className="movimentacao-estorno-link"
            >
              <ExternalLink size={17} />
              Ver movimentação de estorno
            </Link>
          )}

          {movimentacao.tipo === "estorno" &&
            movimentacao.movimentacaoOriginalId && (
              <Link
                href={`/estoque/movimentacoes/${movimentacao.movimentacaoOriginalId}`}
                className="movimentacao-estorno-link"
              >
                <ExternalLink size={17} />
                Ver movimentação original
              </Link>
            )}
        </section>

        {/* GRID PRINCIPAL */}

        <div className="movimentacao-details-grid">
          {/* PRODUTO */}

          <section className="admin-card movimentacao-product-card">
            <div className="movimentacao-section-header">
              <div className="movimentacao-section-icon">
                <Package size={20} />
              </div>

              <div>
                <span className="admin-eyebrow">Produto</span>

                <h2>Produto movimentado</h2>
              </div>
            </div>

            <div className="movimentacao-product-info">
              <div className="movimentacao-product-name">
                <strong>{movimentacao.produtoNome}</strong>

                <span>Código do produto</span>
              </div>

              <div className="movimentacao-product-code">
                {movimentacao.produtoCodigo}
              </div>
            </div>
          </section>

          {/* RESUMO */}

          <section className="admin-card movimentacao-summary-card">
            <div className="movimentacao-section-header">
              <div className={`movimentacao-section-icon ${movimentacao.tipo}`}>
                <IconeTipo size={20} />
              </div>

              <div>
                <span className="admin-eyebrow">Operação</span>

                <h2>Resumo da movimentação</h2>
              </div>
            </div>

            <div className="movimentacao-summary-values">
              <div>
                <span>Tipo</span>

                <strong
                  className={`movimentacao-inline-type ${movimentacao.tipo}`}
                >
                  {tipoConfig.nome}
                </strong>
              </div>

              <div>
                <span>Motivo</span>

                <strong>{obterNomeMotivo(movimentacao.motivo)}</strong>
              </div>

              <div>
                <span>Quantidade</span>

                <strong
                  className={
                    diferencaPositiva
                      ? "positive"
                      : diferencaNegativa
                        ? "negative"
                        : ""
                  }
                >
                  {diferencaPositiva ? "+" : diferencaNegativa ? "-" : ""}

                  {movimentacao.quantidade}
                </strong>
              </div>
            </div>
          </section>

          {/* ORIGEM DA VENDA */}

          {possuiOrigemVenda && (
            <section className="admin-card movimentacao-origin-card">
              <div className="movimentacao-section-header">
                <div className="movimentacao-section-icon venda">
                  <FileText size={20} />
                </div>

                <div>
                  <span className="admin-eyebrow">Origem</span>

                  <h2>Venda relacionada</h2>
                </div>
              </div>

              <div className="movimentacao-origin-content">
                <div className="movimentacao-origin-main">
                  <span>Número da venda</span>

                  <strong>
                    {movimentacao.vendaNumero
                      ? `#${movimentacao.vendaNumero}`
                      : "Venda vinculada"}
                  </strong>
                </div>

                {movimentacao.motivo === "devolucao" && (
                  <p className="movimentacao-origin-description">
                    Esta movimentação foi gerada pela devolução/ estorno da
                    venda relacionada.
                  </p>
                )}

                {vendaHref ? (
                  <Link href={vendaHref} className="movimentacao-venda-link">
                    <ExternalLink size={17} />
                    Ver detalhes da venda
                  </Link>
                ) : (
                  <div className="movimentacao-origin-id">
                    <span>Identificador da venda</span>

                    <strong>{movimentacao.vendaId}</strong>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ALTERAÇÃO DE ESTOQUE */}

          <section className="admin-card movimentacao-stock-card">
            <div className="movimentacao-section-header">
              <div className="movimentacao-section-icon">
                <Boxes size={20} />
              </div>

              <div>
                <span className="admin-eyebrow">Estoque</span>

                <h2>Alteração realizada</h2>
              </div>
            </div>

            <div className="movimentacao-stock-flow">
              <div className="movimentacao-stock-value">
                <span>Estoque anterior</span>

                <strong>{movimentacao.estoqueAnterior}</strong>
              </div>

              <div className="movimentacao-stock-arrow">
                <ArrowRight size={24} />
              </div>

              <div className="movimentacao-stock-value current">
                <span>Estoque resultante</span>

                <strong>{movimentacao.estoqueAtual}</strong>
              </div>
            </div>

            <div
              className={`movimentacao-stock-difference ${
                diferencaPositiva
                  ? "positive"
                  : diferencaNegativa
                    ? "negative"
                    : "neutral"
              }`}
            >
              <span>Alteração no estoque</span>

              <strong>
                {diferencaPositiva ? "+" : diferencaNegativa ? "" : "±"}

                {diferenca}
              </strong>
            </div>
          </section>

          {/* DATA */}

          <section className="admin-card movimentacao-date-card">
            <div className="movimentacao-section-header">
              <div className="movimentacao-section-icon">
                <Calendar size={20} />
              </div>

              <div>
                <span className="admin-eyebrow">Registro</span>

                <h2>Data da movimentação</h2>
              </div>
            </div>

            <div className="movimentacao-date-content">
              <div>
                <Calendar size={18} />

                <span>{formatarDataHora(movimentacao.data)}</span>
              </div>

              <div>
                <Clock size={18} />

                <span>Registro realizado no sistema</span>
              </div>
            </div>
          </section>

          {/* OBSERVAÇÃO */}

          <section className="admin-card movimentacao-observation-card">
            <div className="movimentacao-section-header">
              <div className="movimentacao-section-icon">
                <FileText size={20} />
              </div>

              <div>
                <span className="admin-eyebrow">Observação</span>

                <h2>Informações adicionais</h2>
              </div>
            </div>

            <div className="movimentacao-observation-content">
              {movimentacao.observacao ? (
                <p>{movimentacao.observacao}</p>
              ) : (
                <div className="movimentacao-no-observation">
                  <Info size={20} />

                  <span>
                    Nenhuma observação adicional foi informada para esta
                    movimentação.
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO */}

      {confirmarEstorno && (
        <div className="movimentacao-modal-overlay">
          <div
            className="movimentacao-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-estorno-titulo"
          >
            <div className="movimentacao-modal-icon">
              <AlertTriangle size={28} />
            </div>

            <h2 id="modal-estorno-titulo">Confirmar estorno?</h2>

            <p>
              Esta ação criará uma nova movimentação para desfazer esta operação
              e atualizará o estoque do produto automaticamente.
            </p>

            <div className="movimentacao-modal-info">
              <span>Produto</span>

              <strong>{movimentacao.produtoNome}</strong>

              <span>Quantidade original</span>

              <strong>{movimentacao.quantidade}</strong>
            </div>

            {erro && (
              <div className="movimentacao-modal-error">
                <AlertTriangle size={17} />

                <span>{erro}</span>
              </div>
            )}

            <div className="movimentacao-modal-actions">
              <button
                type="button"
                className="movimentacao-modal-cancel"
                onClick={cancelarEstorno}
                disabled={estornando}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="movimentacao-modal-confirm"
                onClick={confirmarEstornoMovimentacao}
                disabled={estornando}
              >
                <RotateCcw size={17} />

                {estornando ? "Estornando..." : "Confirmar estorno"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
