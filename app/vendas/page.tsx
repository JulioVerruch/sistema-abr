"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Plus,
  Search,
  ShoppingCart,
  XCircle,
} from "lucide-react";

import { AppShell } from "../../components/layout/AppShell";

import {
  obterResumoVendas,
  obterStatusVendaLabel,
  obterVendas,
  type StatusVenda,
  type Venda,
} from "../../data/vendasStore";

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);

  const [busca, setBusca] = useState("");

  const [statusFiltro, setStatusFiltro] = useState<"todos" | StatusVenda>(
    "todos",
  );

  const [pagamentoFiltro, setPagamentoFiltro] = useState("todos");

  const [carregando, setCarregando] = useState(true);

  /* =========================================================
     CARREGAR VENDAS
     ========================================================= */

  function carregarVendas() {
    setVendas(obterVendas());
    setCarregando(false);
  }

  useEffect(() => {
    carregarVendas();

    function atualizar() {
      carregarVendas();
    }

    window.addEventListener("abr-agro-vendas-atualizadas", atualizar);

    return () => {
      window.removeEventListener("abr-agro-vendas-atualizadas", atualizar);
    };
  }, []);

  /* =========================================================
     RESUMO
     ========================================================= */

  const resumo = useMemo(() => obterResumoVendas(), [vendas]);

  /* =========================================================
     FILTRO
     ========================================================= */

  const vendasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return vendas.filter((venda) => {
      const correspondeBusca =
        !termo ||
        venda.numero.toLowerCase().includes(termo) ||
        venda.clienteNome.toLowerCase().includes(termo) ||
        obterStatusVendaLabel(venda.status).toLowerCase().includes(termo);

      const correspondeStatus =
        statusFiltro === "todos" || venda.status === statusFiltro;

      const correspondePagamento =
        pagamentoFiltro === "todos" || venda.formaPagamento === pagamentoFiltro;

      return correspondeBusca && correspondeStatus && correspondePagamento;
    });
  }, [vendas, busca, statusFiltro, pagamentoFiltro]);

  /* =========================================================
     FORMATAÇÃO
     ========================================================= */

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data: string) {
    const valor = new Date(data);

    if (Number.isNaN(valor.getTime())) {
      return "—";
    }

    return valor.toLocaleDateString("pt-BR");
  }

  function obterFormaPagamentoLabel(formaPagamento?: Venda["formaPagamento"]) {
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
        return "Não informado";
    }
  }

  /* =========================================================
     ÍCONE DO STATUS
     ========================================================= */

  function renderStatusIcon(status: StatusVenda) {
    switch (status) {
      case "concluida":
        return <CheckCircle2 size={15} />;

      case "pendente":
        return <Clock3 size={15} />;

      case "cancelada":
        return <XCircle size={15} />;

      default:
        return <FileText size={15} />;
    }
  }

  /* =========================================================
     PÁGINA
     ========================================================= */

  return (
    <AppShell
      title="Vendas"
      description="Gerencie vendas, clientes e movimentações comerciais."
    >
      <section className="admin-page vendas-page">
        {/* =================================================
            CABEÇALHO
        ================================================== */}

        <div className="admin-page-header">
          <div>
            <span className="admin-eyebrow">Gestão comercial</span>

            <h2>Vendas</h2>

            <p>Acompanhe as vendas realizadas e gerencie novos pedidos.</p>
          </div>

          <div className="admin-page-actions">
            <Link href="/vendas/nova" className="btn primary">
              <Plus size={18} />
              Nova venda
            </Link>
          </div>
        </div>

        {/* =================================================
            INDICADORES
        ================================================== */}

        <div className="vendas-resumo">
          {/* TOTAL */}

          <button
            type="button"
            className={
              statusFiltro === "todos"
                ? "vendas-resumo-card ativo"
                : "vendas-resumo-card"
            }
            onClick={() => setStatusFiltro("todos")}
          >
            <div className="vendas-resumo-icon">
              <ShoppingCart size={20} />
            </div>

            <div>
              <span>Total de vendas</span>

              <strong>{resumo.total}</strong>
            </div>
          </button>

          {/* CONCLUÍDAS */}

          <button
            type="button"
            className={
              statusFiltro === "concluida"
                ? "vendas-resumo-card ativo"
                : "vendas-resumo-card"
            }
            onClick={() => setStatusFiltro("concluida")}
          >
            <div className="vendas-resumo-icon sucesso">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <span>Concluídas</span>

              <strong>{resumo.concluidas}</strong>
            </div>
          </button>

          {/* PENDENTES */}

          <button
            type="button"
            className={
              statusFiltro === "pendente"
                ? "vendas-resumo-card ativo"
                : "vendas-resumo-card"
            }
            onClick={() => setStatusFiltro("pendente")}
          >
            <div className="vendas-resumo-icon pendente">
              <Clock3 size={20} />
            </div>

            <div>
              <span>Pendentes</span>

              <strong>{resumo.pendentes}</strong>
            </div>
          </button>

          {/* CANCELADAS */}

          <button
            type="button"
            className={
              statusFiltro === "cancelada"
                ? "vendas-resumo-card ativo"
                : "vendas-resumo-card"
            }
            onClick={() => setStatusFiltro("cancelada")}
          >
            <div className="vendas-resumo-icon cancelada">
              <XCircle size={20} />
            </div>

            <div>
              <span>Canceladas</span>

              <strong>{resumo.canceladas}</strong>
            </div>
          </button>

          {/* VALOR */}

          <article className="vendas-resumo-card vendas-resumo-valor">
            <div className="vendas-resumo-icon valor">
              <CircleDollarSign size={20} />
            </div>

            <div>
              <span>Valor vendido</span>

              <strong>{formatarMoeda(resumo.valorTotal)}</strong>
            </div>
          </article>
        </div>

        {/* =================================================
            FILTROS
        ================================================== */}

        <section className="admin-card vendas-filtros">
          <div className="vendas-busca">
            <Search size={18} />

            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por número, cliente ou status..."
            />
          </div>

          <div className="vendas-filtro-status">
            <button
              type="button"
              className={statusFiltro === "todos" ? "ativo" : ""}
              onClick={() => setStatusFiltro("todos")}
            >
              Todas
            </button>

            <button
              type="button"
              className={statusFiltro === "rascunho" ? "ativo" : ""}
              onClick={() => setStatusFiltro("rascunho")}
            >
              Rascunhos
            </button>

            <button
              type="button"
              className={statusFiltro === "pendente" ? "ativo" : ""}
              onClick={() => setStatusFiltro("pendente")}
            >
              Pendentes
            </button>

            <button
              type="button"
              className={statusFiltro === "concluida" ? "ativo" : ""}
              onClick={() => setStatusFiltro("concluida")}
            >
              Concluídas
            </button>

            <button
              type="button"
              className={statusFiltro === "cancelada" ? "ativo" : ""}
              onClick={() => setStatusFiltro("cancelada")}
            >
              Canceladas
            </button>
          </div>

          <div className="vendas-filtro-pagamento">
            <label htmlFor="vendas-pagamento-filtro">Pagamento</label>

            <select
              id="vendas-pagamento-filtro"
              value={pagamentoFiltro}
              onChange={(event) => setPagamentoFiltro(event.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="pix">PIX</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao_credito">Cartão de crédito</option>
              <option value="cartao_debito">Cartão de débito</option>
              <option value="boleto">Boleto</option>
              <option value="transferencia">Transferência</option>
              <option value="outro">Outro</option>
            </select>
          </div>
        </section>

        {/* =================================================
            LISTAGEM
        ================================================== */}

        <section className="admin-card vendas-lista-card">
          <div className="admin-card-header">
            <div>
              <span className="admin-eyebrow">Histórico</span>

              <h3>Vendas</h3>

              <p>
                {vendasFiltradas.length}{" "}
                {vendasFiltradas.length === 1
                  ? "venda encontrada"
                  : "vendas encontradas"}
              </p>
            </div>

            <ShoppingCart size={24} />
          </div>

          {/* =================================================
              CARREGANDO
          ================================================== */}

          {carregando ? (
            <div className="admin-empty vendas-empty">
              <ShoppingCart size={30} />

              <strong>Carregando vendas...</strong>
            </div>
          ) : vendasFiltradas.length === 0 ? (
            /* =================================================
               VAZIO
            ================================================== */

            <div className="admin-empty vendas-empty">
              <div className="vendas-empty-icon">
                <ShoppingCart size={30} />
              </div>

              <strong>Nenhuma venda encontrada</strong>

              <span>
                {busca || statusFiltro !== "todos"
                  ? "Tente alterar os filtros ou realizar uma nova busca."
                  : "As vendas cadastradas aparecerão aqui."}
              </span>

              {!busca && statusFiltro === "todos" && (
                <Link href="/vendas/nova" className="btn primary">
                  <Plus size={17} />
                  Criar primeira venda
                </Link>
              )}
            </div>
          ) : (
            /* =================================================
               TABELA
            ================================================== */

            <div className="vendas-tabela-wrapper">
              <div className="vendas-tabela">
                {/* CABEÇALHO */}

                <div className="vendas-tabela-header">
                  <span>Venda</span>

                  <span>Cliente</span>

                  <span>Data</span>

                  <span>Itens</span>

                  <span>Total</span>

                  <span>Pagamento</span>

                  <span>Status</span>

                  <span></span>
                </div>

                {/* LINHAS */}

                {vendasFiltradas.map((venda) => (
                  <Link
                    key={venda.id}
                    href={`/vendas/${venda.id}`}
                    className="vendas-tabela-row"
                  >
                    <div className="venda-numero">
                      <strong>#{venda.numero}</strong>

                      <span>
                        {venda.status === "rascunho" ? "Em edição" : "Venda"}
                      </span>
                    </div>

                    <div className="venda-cliente">
                      <strong>{venda.clienteNome}</strong>
                    </div>

                    <div className="venda-data">
                      {formatarData(venda.dataVenda)}
                    </div>

                    <div className="venda-itens">
                      {venda.itens.length}{" "}
                      {venda.itens.length === 1 ? "item" : "itens"}
                    </div>

                    <div className="venda-total">
                      <strong>{formatarMoeda(venda.total)}</strong>
                    </div>

                    <div className="venda-pagamento">
                      {obterFormaPagamentoLabel(venda.formaPagamento)}
                    </div>

                    <div>
                      <span className={`venda-status status-${venda.status}`}>
                        {renderStatusIcon(venda.status)}

                        {obterStatusVendaLabel(venda.status)}
                      </span>
                    </div>

                    <div className="venda-arrow">
                      <ArrowRight size={17} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}
