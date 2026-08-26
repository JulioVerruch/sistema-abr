"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Package,
  User,
  XCircle,
} from "lucide-react";

import { AppShell } from "../../../components/layout/AppShell";

import {
  obterVendaPorId,
  cancelarVenda,
  type Venda,
  type FormaPagamento,
} from "../../../data/vendasStore";

/* =========================================================
   UTILITÁRIOS
========================================================= */

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

function formatarData(data?: string) {
  if (!data) {
    return "-";
  }

  const dataObj = new Date(data);

  if (Number.isNaN(dataObj.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(dataObj);
}

function obterStatusLabel(status: Venda["status"]) {
  switch (status) {
    case "concluida":
      return "Concluída";

    case "pendente":
      return "Pendente";

    case "rascunho":
      return "Rascunho";

    case "cancelada":
      return "Cancelada";

    default:
      return status;
  }
}

function obterStatusClasse(status: Venda["status"]) {
  switch (status) {
    case "concluida":
      return "concluida";

    case "pendente":
      return "pendente";

    case "rascunho":
      return "rascunho";

    case "cancelada":
      return "cancelada";

    default:
      return "";
  }
}

function obterFormaPagamentoLabel(formaPagamento?: FormaPagamento) {
  if (!formaPagamento) {
    return "Não informado";
  }

  switch (formaPagamento) {
    case "pix":
      return "PIX";

    case "dinheiro":
      return "Dinheiro";

    case "cartao_credito":
      return "Cartão de crédito";

    case "cartao_debito":
      return "Cartão de débito";

    case "boleto":
      return "Boleto";

    case "transferencia":
      return "Transferência";

    case "outro":
      return "Outro";

    default:
      return formaPagamento;
  }
}

/* =========================================================
   PÁGINA
========================================================= */

export default function VendaDetalhesPage() {
  const params = useParams();

  const vendaId = String(params?.id ?? "");

  const [venda, setVenda] = useState<Venda | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [mostrarConfirmacaoCancelamento, setMostrarConfirmacaoCancelamento] =
    useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [mensagemCancelamento, setMensagemCancelamento] = useState("");
  const [erroCancelamento, setErroCancelamento] = useState("");

  /* =======================================================
     CARREGAR VENDA
  ======================================================= */

  useEffect(() => {
    if (!vendaId) {
      setCarregando(false);
      return;
    }

    try {
      const vendaEncontrada = obterVendaPorId(vendaId);

      setVenda(vendaEncontrada ?? null);
    } catch (error) {
      console.error("Erro ao carregar venda:", error);
      setVenda(null);
    } finally {
      setCarregando(false);
    }
  }, [vendaId]);

  /* =======================================================
     TOTAL DE PRODUTOS
  ======================================================= */

  const quantidadeTotal = useMemo(() => {
    if (!venda) {
      return 0;
    }

    return venda.itens.reduce(
      (total, item) => total + Number(item.quantidade || 0),
      0,
    );
  }, [venda]);

  /* =======================================================
     CARREGANDO
  ======================================================= */

  if (carregando) {
    return (
      <AppShell
        title="Detalhes da venda"
        description="Carregando informações da venda."
      >
        <section className="admin-page">
          <div className="admin-card">
            <div style={{ padding: "32px", textAlign: "center" }}>
              <Clock3 size={28} />
              <p>Carregando venda...</p>
            </div>
          </div>
        </section>
      </AppShell>
    );
  }

  /* =======================================================
     VENDA NÃO ENCONTRADA
  ======================================================= */

  if (!venda) {
    return (
      <AppShell
        title="Venda não encontrada"
        description="Não foi possível localizar a venda solicitada."
      >
        <section className="admin-page">
          <div className="admin-page-header">
            <div>
              <span className="admin-eyebrow">Gestão comercial</span>

              <h2>Venda não encontrada</h2>

              <p>A venda solicitada não existe ou não está mais disponível.</p>
            </div>

            <div className="admin-page-actions">
              <Link href="/vendas" className="btn">
                <ArrowLeft size={18} />
                Voltar para vendas
              </Link>
            </div>
          </div>

          <article className="admin-card">
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <Package size={42} />

              <h3>Venda não localizada</h3>

              <p>Verifique o endereço ou retorne para a listagem de vendas.</p>
            </div>
          </article>
        </section>
      </AppShell>
    );
  }

  /* =======================================================
     CANCELAMENTO
  ======================================================= */

  async function processarCancelamento() {
    if (!venda || cancelando) {
      return;
    }

    setCancelando(true);
    setErroCancelamento("");
    setMensagemCancelamento("");

    try {
      const vendaCancelada = cancelarVenda(venda.id);

      if (!vendaCancelada) {
        throw new Error("Não foi possível cancelar a venda.");
      }

      setVenda(vendaCancelada);
      setMostrarConfirmacaoCancelamento(false);
      setMensagemCancelamento(
        "Venda cancelada com sucesso. O estoque dos produtos foi estornado.",
      );
    } catch (error) {
      console.error("Erro ao cancelar venda:", error);

      setErroCancelamento(
        error instanceof Error
          ? error.message
          : "Não foi possível cancelar a venda.",
      );
    } finally {
      setCancelando(false);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <AppShell
      title={`Venda ${venda.numero}`}
      description="Visualize todos os detalhes da venda."
    >
      <section className="admin-page vendas-detalhes-page">
        {/* =================================================
            CABEÇALHO
        ================================================== */}

        <div className="admin-page-header">
          <div>
            <span className="admin-eyebrow">Gestão comercial</span>

            <h2>Venda {venda.numero}</h2>

            <p>
              Consulte os produtos, cliente, pagamento e valores registrados
              nesta venda.
            </p>
          </div>

          <div className="admin-page-actions">
            <Link href="/vendas" className="btn">
              <ArrowLeft size={18} />
              Voltar para vendas
            </Link>

            {venda.status === "concluida" && (
              <button
                type="button"
                className="btn vendas-cancelar-btn"
                onClick={() => {
                  setErroCancelamento("");
                  setMensagemCancelamento("");
                  setMostrarConfirmacaoCancelamento(true);
                }}
                disabled={cancelando}
              >
                <XCircle size={18} />
                Cancelar venda
              </button>
            )}
          </div>
        </div>

        {/* =================================================
            STATUS
        ================================================== */}

        <article className="admin-card vendas-detalhes-status-card">
          <div className="vendas-detalhes-status-main">
            <div
              className={`vendas-detalhes-status-icon ${obterStatusClasse(
                venda.status,
              )}`}
            >
              {venda.status === "concluida" ? (
                <CheckCircle2 size={24} />
              ) : (
                <Clock3 size={24} />
              )}
            </div>

            <div>
              <span className="admin-eyebrow">Status da venda</span>

              <h3>{obterStatusLabel(venda.status)}</h3>

              <p>Venda registrada em {formatarData(venda.criadoEm)}</p>
            </div>
          </div>

          <div className="vendas-detalhes-status-value">
            <span>Total</span>

            <strong>{formatarMoeda(venda.total)}</strong>
          </div>
        </article>

        {mensagemCancelamento && (
          <div className="vendas-cancelamento-alert vendas-cancelamento-sucesso">
            <CheckCircle2 size={18} />
            <span>{mensagemCancelamento}</span>
          </div>
        )}

        {erroCancelamento && (
          <div className="vendas-cancelamento-alert vendas-cancelamento-erro">
            <XCircle size={18} />
            <span>{erroCancelamento}</span>
          </div>
        )}

        {/* =================================================
            GRID PRINCIPAL
        ================================================== */}

        <div className="vendas-detalhes-grid">
          <div className="vendas-detalhes-main">
            {/* =============================================
                CLIENTE
            ============================================== */}

            <article className="admin-card">
              <div className="admin-card-header">
                <div>
                  <span className="admin-eyebrow">Cliente</span>

                  <h3>Dados do cliente</h3>

                  <p>Cliente associado à venda.</p>
                </div>

                <User size={23} />
              </div>

              <div className="vendas-detalhes-info-grid">
                <div>
                  <span>Nome</span>

                  <strong>{venda.clienteNome}</strong>
                </div>

                <div>
                  <span>ID do cliente</span>

                  <strong>{venda.clienteId}</strong>
                </div>
              </div>
            </article>

            {/* =============================================
                PRODUTOS
            ============================================== */}

            <article className="admin-card">
              <div className="admin-card-header">
                <div>
                  <span className="admin-eyebrow">Produtos</span>

                  <h3>Itens da venda</h3>

                  <p>
                    {quantidadeTotal} unidade
                    {quantidadeTotal === 1 ? "" : "s"} em {venda.itens.length}{" "}
                    produto
                    {venda.itens.length === 1 ? "" : "s"}.
                  </p>
                </div>

                <Package size={23} />
              </div>

              <div className="vendas-detalhes-itens">
                {venda.itens.map((item) => (
                  <div className="vendas-detalhes-item" key={item.id}>
                    <div className="vendas-detalhes-item-produto">
                      <div className="vendas-detalhes-item-icon">
                        <Package size={19} />
                      </div>

                      <div>
                        <strong>{item.produtoNome}</strong>

                        <span>Código: {item.produtoId}</span>
                      </div>
                    </div>

                    <div className="vendas-detalhes-item-quantidade">
                      <span>Quantidade</span>

                      <strong>{item.quantidade}</strong>
                    </div>

                    <div className="vendas-detalhes-item-preco">
                      <span>Preço unitário</span>

                      <strong>{formatarMoeda(item.precoUnitario)}</strong>
                    </div>

                    <div className="vendas-detalhes-item-desconto">
                      <span>Desconto</span>

                      <strong>{formatarMoeda(item.desconto)}</strong>
                    </div>

                    <div className="vendas-detalhes-item-total">
                      <span>Subtotal</span>

                      <strong>{formatarMoeda(item.subtotal)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* =============================================
                OBSERVAÇÃO
            ============================================== */}

            {venda.observacao && (
              <article className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <span className="admin-eyebrow">
                      Informações adicionais
                    </span>

                    <h3>Observação</h3>
                  </div>

                  <FileText size={23} />
                </div>

                <div className="vendas-detalhes-observacao">
                  {venda.observacao}
                </div>
              </article>
            )}
          </div>

          {/* =================================================
              SIDEBAR
          ================================================== */}

          <aside className="vendas-detalhes-sidebar">
            {/* =============================================
                RESUMO FINANCEIRO
            ============================================== */}

            <article className="admin-card vendas-detalhes-resumo">
              <div className="admin-card-header">
                <div>
                  <span className="admin-eyebrow">Resumo</span>

                  <h3>Resumo financeiro</h3>
                </div>

                <CircleDollarSign size={23} />
              </div>

              <div className="vendas-detalhes-resumo-linhas">
                <div>
                  <span>Produtos</span>

                  <strong>{venda.itens.length}</strong>
                </div>

                <div>
                  <span>Quantidade</span>

                  <strong>{quantidadeTotal}</strong>
                </div>

                <div>
                  <span>Subtotal</span>

                  <strong>{formatarMoeda(venda.subtotal)}</strong>
                </div>

                <div>
                  <span>Desconto</span>

                  <strong className="vendas-desconto-valor">
                    - {formatarMoeda(venda.desconto)}
                  </strong>
                </div>
              </div>

              <div className="vendas-detalhes-total">
                <span>Total da venda</span>

                <strong>{formatarMoeda(venda.total)}</strong>
              </div>
            </article>

            {/* =============================================
                PAGAMENTO
            ============================================== */}

            <article className="admin-card">
              <div className="admin-card-header">
                <div>
                  <span className="admin-eyebrow">Pagamento</span>

                  <h3>Forma de pagamento</h3>
                </div>

                <CircleDollarSign size={23} />
              </div>

              <div className="vendas-detalhes-pagamento">
                <strong>
                  {obterFormaPagamentoLabel(venda.formaPagamento)}
                </strong>
              </div>
            </article>

            {/* =============================================
                DATA
            ============================================== */}

            <article className="admin-card">
              <div className="admin-card-header">
                <div>
                  <span className="admin-eyebrow">Registro</span>

                  <h3>Informações da venda</h3>
                </div>

                <CalendarDays size={23} />
              </div>

              <div className="vendas-detalhes-datas">
                <div>
                  <span>Data de criação</span>

                  <strong>{formatarData(venda.criadoEm)}</strong>
                </div>

                <div>
                  <span>Venda</span>

                  <strong>{venda.numero}</strong>
                </div>

                <div>
                  <span>ID</span>

                  <strong>{venda.id}</strong>
                </div>
              </div>
            </article>
          </aside>
        </div>
        {mostrarConfirmacaoCancelamento && (
          <div
            className="vendas-confirmacao-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancelar-venda-titulo"
          >
            <div className="vendas-confirmacao-card">
              <div className="vendas-confirmacao-icon">
                <XCircle size={27} />
              </div>

              <div className="vendas-confirmacao-content">
                <span className="admin-eyebrow">Atenção</span>

                <h3 id="cancelar-venda-titulo">Cancelar venda?</h3>

                <p>
                  Você está prestes a cancelar a venda{" "}
                  <strong>{venda.numero}</strong>.
                </p>

                <p>
                  Os produtos desta venda serão devolvidos ao estoque e uma
                  movimentação de devolução será registrada.
                </p>

                <div className="vendas-confirmacao-resumo">
                  <div>
                    <span>Produtos</span>
                    <strong>{venda.itens.length}</strong>
                  </div>

                  <div>
                    <span>Quantidade</span>
                    <strong>{quantidadeTotal}</strong>
                  </div>

                  <div>
                    <span>Total</span>
                    <strong>{formatarMoeda(venda.total)}</strong>
                  </div>
                </div>
              </div>

              <div className="vendas-confirmacao-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setMostrarConfirmacaoCancelamento(false)}
                  disabled={cancelando}
                >
                  Voltar
                </button>

                <button
                  type="button"
                  className="btn vendas-confirmar-cancelamento"
                  onClick={processarCancelamento}
                  disabled={cancelando}
                >
                  <XCircle size={17} />

                  {cancelando ? "Cancelando..." : "Confirmar cancelamento"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
