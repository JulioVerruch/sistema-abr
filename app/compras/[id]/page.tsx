"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Package,
  PackageCheck,
  Save,
  Truck,
  XCircle,
} from "lucide-react";

import { AppShell } from "../../../components/layout/AppShell";
import {
  cancelarCompra,
  obterCompraPorId,
  obterStatusCompraLabel,
  receberCompra,
  type Compra,
} from "../../../data/comprasStore";

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(data?: string) {
  if (!data) {
    return "—";
  }

  const dataObj = new Date(data);

  if (Number.isNaN(dataObj.getTime())) {
    return data;
  }

  return new Intl.DateTimeFormat("pt-BR").format(dataObj);
}

function obterClasseStatus(status: Compra["status"]) {
  switch (status) {
    case "recebida":
      return "status-pill success";

    case "parcial":
      return "status-pill warning";

    case "cancelada":
      return "status-pill danger";

    case "rascunho":
      return "status-pill neutral";

    default:
      return "status-pill info";
  }
}

export default function CompraDetalhesPage() {
  const params = useParams();
  const router = useRouter();

  const id = typeof params.id === "string" ? decodeURIComponent(params.id) : "";

  const [compra, setCompra] = useState<Compra | null>(null);

  const [carregando, setCarregando] = useState(true);

  const [recebendo, setRecebendo] = useState(false);

  const [cancelando, setCancelando] = useState(false);

  const [mostrarConfirmacaoCancelamento, setMostrarConfirmacaoCancelamento] =
    useState(false);

  const [erro, setErro] = useState("");

  const [mensagem, setMensagem] = useState("");

  const [quantidades, setQuantidades] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) {
      setCarregando(false);
      return;
    }

    const compraEncontrada = obterCompraPorId(id);

    if (!compraEncontrada) {
      setCompra(null);
      setCarregando(false);
      return;
    }

    setCompra(compraEncontrada);

    const quantidadesIniciais: Record<string, string> = {};

    compraEncontrada.itens.forEach((item) => {
      const pendente = Math.max(0, item.quantidade - item.quantidadeRecebida);

      quantidadesIniciais[item.produtoId] =
        pendente > 0 ? String(pendente) : "0";
    });

    setQuantidades(quantidadesIniciais);

    setCarregando(false);
  }, [id]);

  const resumo = useMemo(() => {
    if (!compra) {
      return {
        totalItens: 0,
        totalComprado: 0,
        totalRecebido: 0,
        totalPendente: 0,
      };
    }

    return compra.itens.reduce(
      (acc, item) => {
        acc.totalItens += 1;

        acc.totalComprado += item.quantidade;

        acc.totalRecebido += item.quantidadeRecebida;

        acc.totalPendente += Math.max(
          0,
          item.quantidade - item.quantidadeRecebida,
        );

        return acc;
      },
      {
        totalItens: 0,
        totalComprado: 0,
        totalRecebido: 0,
        totalPendente: 0,
      },
    );
  }, [compra]);

  function alterarQuantidade(produtoId: string, valor: string) {
    setMensagem("");
    setErro("");

    setQuantidades((atual) => ({
      ...atual,
      [produtoId]: valor,
    }));
  }

  function preencherTodosPendentes() {
    if (!compra) {
      return;
    }

    const novasQuantidades: Record<string, string> = {};

    compra.itens.forEach((item) => {
      const pendente = Math.max(0, item.quantidade - item.quantidadeRecebida);

      novasQuantidades[item.produtoId] = String(pendente);
    });

    setQuantidades(novasQuantidades);

    setErro("");
    setMensagem("");
  }

  function limparRecebimento() {
    if (!compra) {
      return;
    }

    const novasQuantidades: Record<string, string> = {};

    compra.itens.forEach((item) => {
      novasQuantidades[item.produtoId] = "0";
    });

    setQuantidades(novasQuantidades);

    setErro("");
    setMensagem("");
  }

  function processarRecebimento() {
    if (!compra) {
      return;
    }

    setErro("");
    setMensagem("");
    setRecebendo(true);

    try {
      const quantidadesNumericas: Record<string, number> = {};

      compra.itens.forEach((item) => {
        const valor = Number(quantidades[item.produtoId]) || 0;

        quantidadesNumericas[item.produtoId] = valor;
      });

      const compraAtualizada = receberCompra(compra.id, quantidadesNumericas);

      setCompra(compraAtualizada);

      const novasQuantidades: Record<string, string> = {};

      compraAtualizada.itens.forEach((item) => {
        const pendente = Math.max(0, item.quantidade - item.quantidadeRecebida);

        novasQuantidades[item.produtoId] =
          pendente > 0 ? String(pendente) : "0";
      });

      setQuantidades(novasQuantidades);

      setMensagem(
        compraAtualizada.status === "recebida"
          ? "Compra recebida integralmente e estoque atualizado."
          : "Recebimento parcial registrado e estoque atualizado.",
      );
    } catch (error) {
      console.error("Erro ao receber compra:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar o recebimento.",
      );
    } finally {
      setRecebendo(false);
    }
  }

  function processarCancelamento() {
    if (!compra) {
      return;
    }

    setErro("");
    setMensagem("");
    setCancelando(true);

    try {
      const compraCancelada = cancelarCompra(compra.id);

      setCompra(compraCancelada);

      setMostrarConfirmacaoCancelamento(false);

      setMensagem(
        `A compra ${compraCancelada.numero} foi cancelada com sucesso.`,
      );
    } catch (error) {
      console.error("Erro ao cancelar compra:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível cancelar a compra.",
      );
    } finally {
      setCancelando(false);
    }
  }

  if (carregando) {
    return (
      <AppShell
        title="Detalhes da compra"
        description="Carregando informações da compra."
      >
        <section className="admin-page">
          <div className="admin-card">
            <div className="admin-empty">
              <Package size={30} />

              <strong>Carregando compra...</strong>
            </div>
          </div>
        </section>
      </AppShell>
    );
  }

  if (!compra) {
    return (
      <AppShell
        title="Compra não encontrada"
        description="Não foi possível localizar esta compra."
      >
        <section className="admin-page">
          <div className="admin-page-header">
            <div>
              <span className="admin-eyebrow">Compras</span>

              <h2>Compra não encontrada</h2>

              <p>A compra solicitada não existe ou foi removida.</p>
            </div>

            <Link href="/compras" className="btn">
              <ArrowLeft size={18} />
              Voltar para compras
            </Link>
          </div>

          <div className="admin-card">
            <div className="admin-empty">
              <CircleAlert size={32} />

              <strong>Não encontramos esta compra.</strong>

              <span>
                Verifique o endereço ou retorne para a lista de compras.
              </span>
            </div>
          </div>
        </section>
      </AppShell>
    );
  }

  const podeReceber =
    compra.status === "pendente" || compra.status === "parcial";

  return (
    <AppShell
      title={`Compra ${compra.numero}`}
      description="Detalhes, produtos e recebimento da compra."
    >
      <section className="admin-page compras-detalhes-page">
        {/* =====================================================
            CABEÇALHO
        ====================================================== */}

        <div className="admin-page-header">
          <div>
            <span className="admin-eyebrow">Gestão de compras</span>

            <h2>{compra.numero}</h2>

            <p>Acompanhe os produtos, valores e recebimento desta compra.</p>
          </div>

          <div className="admin-page-actions">
            <Link href="/compras" className="btn">
              <ArrowLeft size={18} />
              Voltar para compras
            </Link>
          </div>
        </div>

        {/* =====================================================
            MENSAGENS
        ====================================================== */}

        {erro && (
          <div className="compras-form-error">
            <CircleAlert size={18} />

            <strong>{erro}</strong>
          </div>
        )}

        {mensagem && (
          <div className="compras-detalhes-success">
            <CheckCircle2 size={18} />

            <span>{mensagem}</span>
          </div>
        )}

        {/* =====================================================
            RESUMO
        ====================================================== */}

        <div className="compras-detalhes-resumo-grid">
          <article className="admin-card">
            <div className="compras-detalhes-resumo-icon">
              <Package size={20} />
            </div>

            <span>Produtos</span>

            <strong>{resumo.totalItens}</strong>
          </article>

          <article className="admin-card">
            <div className="compras-detalhes-resumo-icon">
              <PackageCheck size={20} />
            </div>

            <span>Quantidade comprada</span>

            <strong>{resumo.totalComprado}</strong>
          </article>

          <article className="admin-card">
            <div className="compras-detalhes-resumo-icon">
              <CheckCircle2 size={20} />
            </div>

            <span>Recebido</span>

            <strong>{resumo.totalRecebido}</strong>
          </article>

          <article className="admin-card">
            <div className="compras-detalhes-resumo-icon">
              <Truck size={20} />
            </div>

            <span>Pendente</span>

            <strong>{resumo.totalPendente}</strong>
          </article>
        </div>

        {/* =====================================================
            GRID PRINCIPAL
        ====================================================== */}

        <div className="compras-detalhes-grid">
          {/* ===================================================
              COLUNA PRINCIPAL
          ==================================================== */}

          <div className="compras-detalhes-main">
            {/* DADOS */}

            <article className="admin-card">
              <div className="admin-card-header">
                <div>
                  <span className="admin-eyebrow">Informações</span>

                  <h3>Dados da compra</h3>
                </div>

                <div className={obterClasseStatus(compra.status)}>
                  {obterStatusCompraLabel(compra.status)}
                </div>
              </div>

              <div className="compras-detalhes-info-grid">
                <div>
                  <span>Fornecedor</span>

                  <strong>{compra.fornecedorNome}</strong>
                </div>

                <div>
                  <span>Número</span>

                  <strong>{compra.numero}</strong>
                </div>

                <div>
                  <span>Data da compra</span>

                  <strong>
                    <CalendarDays size={15} />

                    {formatarData(compra.dataCompra)}
                  </strong>
                </div>

                <div>
                  <span>Recebimento</span>

                  <strong>
                    {compra.dataRecebimento
                      ? formatarData(compra.dataRecebimento)
                      : "Ainda não recebida"}
                  </strong>
                </div>
              </div>

              {compra.observacao && (
                <div className="compras-detalhes-observacao">
                  <span>Observação</span>

                  <p>{compra.observacao}</p>
                </div>
              )}
            </article>

            {/* PRODUTOS */}

            <article className="admin-card">
              <div className="admin-card-header">
                <div>
                  <span className="admin-eyebrow">Produtos</span>

                  <h3>Itens da compra</h3>

                  <p>Confira o que foi comprado e o que já foi recebido.</p>
                </div>

                <Package size={25} />
              </div>

              {podeReceber && (
                <div className="compras-recebimento-toolbar">
                  <div>
                    <strong>Recebimento</strong>

                    <span>Informe quanto de cada produto chegou.</span>
                  </div>

                  <div>
                    <button
                      type="button"
                      className="btn"
                      onClick={preencherTodosPendentes}
                      disabled={recebendo}
                    >
                      Receber todos
                    </button>

                    <button
                      type="button"
                      className="btn"
                      onClick={limparRecebimento}
                      disabled={recebendo}
                    >
                      Limpar
                    </button>
                  </div>
                </div>
              )}

              <div className="compras-detalhes-itens">
                <div className="compras-detalhes-itens-header">
                  <span>Produto</span>

                  <span>Comprado</span>

                  <span>Recebido</span>

                  <span>Pendente</span>

                  <span>Custo</span>

                  <span>Subtotal</span>
                </div>

                {compra.itens.map((item) => {
                  const pendente = Math.max(
                    0,
                    item.quantidade - item.quantidadeRecebida,
                  );

                  return (
                    <div className="compras-detalhes-item" key={item.produtoId}>
                      <div className="compras-detalhes-produto">
                        <div className="compras-item-icon">
                          <Package size={17} />
                        </div>

                        <div>
                          <strong>{item.produtoNome}</strong>

                          <small>{item.produtoCodigo}</small>
                        </div>
                      </div>

                      <strong>{item.quantidade}</strong>

                      <strong className="text-success">
                        {item.quantidadeRecebida}
                      </strong>

                      <strong
                        className={
                          pendente > 0 ? "text-warning" : "text-success"
                        }
                      >
                        {pendente}
                      </strong>

                      <span>{formatarMoeda(item.valorUnitario)}</span>

                      <strong>{formatarMoeda(item.subtotal)}</strong>

                      {podeReceber && (
                        <div className="compras-detalhes-receber">
                          <label>
                            <span>Receber agora</span>

                            <input
                              type="number"
                              min="0"
                              max={pendente}
                              step="1"
                              value={quantidades[item.produtoId] ?? "0"}
                              disabled={recebendo || pendente === 0}
                              onChange={(event) =>
                                alterarQuantidade(
                                  item.produtoId,
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          </div>

          {/* ===================================================
              SIDEBAR
          ==================================================== */}

          <aside className="compras-detalhes-sidebar">
            {/* VALORES */}

            <article className="admin-card compras-detalhes-valores">
              <div className="admin-card-header">
                <div>
                  <span className="admin-eyebrow">Financeiro</span>

                  <h3>Valores da compra</h3>
                </div>
              </div>

              <div className="compras-resumo-linhas">
                <div>
                  <span>Subtotal</span>

                  <strong>{formatarMoeda(compra.subtotal)}</strong>
                </div>

                <div>
                  <span>Desconto</span>

                  <strong>{formatarMoeda(compra.desconto)}</strong>
                </div>

                <div>
                  <span>Frete</span>

                  <strong>{formatarMoeda(compra.frete)}</strong>
                </div>
              </div>

              <div className="compras-total-final">
                <span>Total</span>

                <strong>{formatarMoeda(compra.total)}</strong>
              </div>
            </article>

            {/* RECEBIMENTO */}

            {podeReceber && (
              <article className="admin-card compras-recebimento-card">
                <div className="admin-card-header">
                  <div>
                    <span className="admin-eyebrow">Estoque</span>

                    <h3>Confirmar recebimento</h3>

                    <p>
                      Ao confirmar, as quantidades informadas serão adicionadas
                      ao estoque.
                    </p>
                  </div>

                  <PackageCheck size={25} />
                </div>

                <div className="compras-recebimento-alert">
                  <CircleAlert size={18} />

                  <span>
                    O sistema registrará automaticamente a entrada como
                    movimentação de
                    <strong> compra</strong>.
                  </span>
                </div>

                <button
                  type="button"
                  className="btn primary compras-confirmar-recebimento"
                  onClick={processarRecebimento}
                  disabled={recebendo}
                >
                  <Save size={18} />

                  {recebendo ? "Registrando..." : "Confirmar recebimento"}
                </button>
              </article>
            )}

            {/* RECEBIDA */}

            {compra.status === "recebida" && (
              <article className="admin-card compras-recebida-card">
                <CheckCircle2 size={28} />

                <strong>Compra recebida</strong>

                <span>
                  Todos os produtos desta compra foram recebidos e lançados no
                  estoque.
                </span>
              </article>
            )}

            {/* CANCELADA */}

            {compra.status === "cancelada" && (
              <article className="admin-card compras-cancelada-card">
                <XCircle size={28} />

                <strong>Compra cancelada</strong>

                <span>Esta compra não pode mais ser recebida.</span>
              </article>
            )}

            {(compra.status === "pendente" || compra.status === "rascunho") && (
              <article className="admin-card compras-cancelamento-card">
                <div className="compras-cancelamento-icon">
                  <XCircle size={22} />
                </div>

                <div>
                  <strong>Cancelar compra</strong>

                  <span>Esta compra ainda não possui produtos recebidos.</span>
                </div>

                <button
                  type="button"
                  className="btn compras-cancelar-btn"
                  onClick={() => setMostrarConfirmacaoCancelamento(true)}
                  disabled={cancelando}
                >
                  Cancelar compra
                </button>
              </article>
            )}

            <Link href="/compras" className="btn compras-voltar-lista">
              <ArrowLeft size={17} />
              Voltar para compras
            </Link>
          </aside>
        </div>
        {mostrarConfirmacaoCancelamento && (
          <div
            className="compras-confirmacao-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancelar-compra-titulo"
          >
            <div className="compras-confirmacao-card">
              <div className="compras-confirmacao-icon">
                <XCircle size={26} />
              </div>

              <div>
                <span className="admin-eyebrow">Atenção</span>

                <h3 id="cancelar-compra-titulo">Cancelar compra?</h3>

                <p>
                  Você está prestes a cancelar a compra{" "}
                  <strong>{compra.numero}</strong>.
                </p>

                <p>
                  Esta ação alterará o status da compra para{" "}
                  <strong>Cancelada</strong>.
                </p>
              </div>

              <div className="compras-confirmacao-actions">
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
                  className="btn compras-confirmar-cancelamento"
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
