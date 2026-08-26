"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  ClipboardList,
  FileText,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Truck,
  XCircle,
} from "lucide-react";

import { AppShell } from "../../components/layout/AppShell";

import {
  Compra,
  obterCompras,
  obterResumoCompras,
  obterStatusCompraLabel,
  StatusCompra,
} from "@/data/comprasStore";

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

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(`${data}T12:00:00`));
  } catch {
    return "—";
  }
}

function obterClasseStatus(status: StatusCompra) {
  const classes: Record<StatusCompra, string> = {
    rascunho: "compra-status compra-status-rascunho",
    pendente: "compra-status compra-status-pendente",
    parcial: "compra-status compra-status-parcial",
    recebida: "compra-status compra-status-recebida",
    cancelada: "compra-status compra-status-cancelada",
  };

  return classes[status];
}

export default function ComprasPage() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [busca, setBusca] = useState("");

  const [filtroStatus, setFiltroStatus] = useState<StatusCompra | "todos">(
    "todos",
  );

  function carregarDados() {
    setCompras(obterCompras());
  }

  useEffect(() => {
    carregarDados();

    const atualizarCompras = () => {
      carregarDados();
    };

    window.addEventListener("storage", atualizarCompras);
    window.addEventListener("focus", atualizarCompras);

    return () => {
      window.removeEventListener("storage", atualizarCompras);
      window.removeEventListener("focus", atualizarCompras);
    };
  }, []);

  const resumo = useMemo(() => {
    return obterResumoCompras();
  }, [compras]);

  const comprasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return compras.filter((compra) => {
      const correspondeStatus =
        filtroStatus === "todos" || compra.status === filtroStatus;

      if (!correspondeStatus) {
        return false;
      }

      if (!termo) {
        return true;
      }

      const textoBusca = [
        compra.numero,
        compra.fornecedorNome,
        compra.status,
        ...compra.itens.map(
          (item) => `${item.produtoNome} ${item.produtoCodigo}`,
        ),
      ]
        .join(" ")
        .toLowerCase();

      return textoBusca.includes(termo);
    });
  }, [compras, busca, filtroStatus]);

  return (
    <AppShell
      title="Compras"
      description="Gerencie pedidos, fornecedores e recebimentos de produtos."
    >
      <section className="admin-page compras-page">
        {/* CABEÇALHO */}

        <div className="admin-page-header">
          <div>
            <span className="admin-eyebrow">Gestão de compras</span>

            <h2>Visão geral das compras</h2>

            <p>
              Gerencie pedidos, acompanhe fornecedores e controle o recebimento
              dos produtos.
            </p>
          </div>

          <div className="admin-page-actions">
            <Link href="/compras/nova" className="btn primary">
              <Plus size={18} />
              Nova compra
            </Link>
          </div>
        </div>

        {/* INDICADORES */}

        <div className="admin-kpi-grid compras-stats-grid">
          {/* TOTAL */}

          <div className="admin-kpi-card compras-stat-card">
            <div className="compras-stat-top">
              <span>Total de compras</span>

              <div className="compras-stat-icon">
                <ShoppingCart size={19} />
              </div>
            </div>

            <strong>{resumo.totalCompras}</strong>

            <p className="text-muted">
              <ClipboardList size={15} />
              Pedidos registrados
            </p>
          </div>

          {/* PENDENTES */}

          <div className="admin-kpi-card compras-stat-card">
            <div className="compras-stat-top">
              <span>Pendentes</span>

              <div className="compras-stat-icon">
                <FileText size={19} />
              </div>
            </div>

            <strong>{resumo.pendentes}</strong>

            <p className="text-gold">
              <Package size={15} />
              Aguardando recebimento
            </p>
          </div>

          {/* RECEBIDAS */}

          <div className="admin-kpi-card compras-stat-card">
            <div className="compras-stat-top">
              <span>Recebidas</span>

              <div className="compras-stat-icon">
                <Truck size={19} />
              </div>
            </div>

            <strong>{resumo.recebidas}</strong>

            <p className="text-success">
              <Package size={15} />
              Compras concluídas
            </p>
          </div>

          {/* VALOR TOTAL */}

          <div className="admin-kpi-card compras-stat-card">
            <div className="compras-stat-top">
              <span>Valor total</span>

              <div className="compras-stat-icon">
                <FileText size={19} />
              </div>
            </div>

            <strong className="compras-stat-money">
              {formatarMoeda(resumo.valorTotal)}
            </strong>

            <p className="text-muted">Valor das compras ativas</p>
          </div>
        </div>

        {/* HISTÓRICO */}

        <section className="admin-card compras-content-card">
          <div className="compras-content-header">
            <div>
              <span className="admin-eyebrow">Pedidos</span>

              <h2>Histórico de compras</h2>

              <p>Consulte e acompanhe todos os pedidos realizados.</p>
            </div>

            <div className="compras-total-encontrado">
              <span>Total encontrado</span>

              <strong>{comprasFiltradas.length}</strong>
            </div>
          </div>

          {/* FILTROS */}

          <div className="compras-filtros">
            <label className="compras-search">
              <Search size={20} />

              <input
                type="text"
                placeholder="Buscar por número, fornecedor ou produto..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
              />
            </label>

            <select
              value={filtroStatus}
              onChange={(event) =>
                setFiltroStatus(event.target.value as StatusCompra | "todos")
              }
              className="compras-status-filter"
            >
              <option value="todos">Todos os status</option>

              <option value="rascunho">Rascunho</option>

              <option value="pendente">Pendente</option>

              <option value="parcial">Parcialmente recebida</option>

              <option value="recebida">Recebida</option>

              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* LISTAGEM */}

          {comprasFiltradas.length === 0 ? (
            <div className="compras-empty">
              <div className="compras-empty-icon">
                <ShoppingCart size={30} />
              </div>

              <h3>
                {compras.length === 0
                  ? "Nenhuma compra registrada"
                  : "Nenhuma compra encontrada"}
              </h3>

              <p>
                {compras.length === 0
                  ? "Comece registrando uma nova compra para acompanhar seus pedidos e recebimentos."
                  : "Tente alterar sua busca ou os filtros selecionados."}
              </p>

              {compras.length === 0 && (
                <Link href="/compras/nova" className="btn primary">
                  <Plus size={18} />
                  Registrar primeira compra
                </Link>
              )}
            </div>
          ) : (
            <div className="compras-table-wrapper">
              <div className="compras-table">
                <div className="compras-table-head">
                  <span>Compra</span>

                  <span>Fornecedor</span>

                  <span>Itens</span>

                  <span>Data</span>

                  <span>Total</span>

                  <span>Status</span>

                  <span>Ação</span>
                </div>

                <div className="compras-table-body">
                  {comprasFiltradas.map((compra) => (
                    <div className="compras-table-row" key={compra.id}>
                      {/* COMPRA */}

                      <div className="compra-numero">
                        <div className="compra-icon">
                          <ShoppingCart size={18} />
                        </div>

                        <div>
                          <strong>{compra.numero}</strong>

                          <small>
                            {compra.observacao || "Compra registrada"}
                          </small>
                        </div>
                      </div>

                      {/* FORNECEDOR */}

                      <div className="compra-fornecedor">
                        {compra.fornecedorNome}
                      </div>

                      {/* ITENS */}

                      <div className="compra-itens">
                        <strong>{compra.itens.length}</strong>

                        <span>
                          {compra.itens.length === 1 ? " produto" : " produtos"}
                        </span>
                      </div>

                      {/* DATA */}

                      <div className="compra-data">
                        {formatarData(compra.dataCompra)}
                      </div>

                      {/* TOTAL */}

                      <div className="compra-total">
                        {formatarMoeda(compra.total)}
                      </div>

                      {/* STATUS */}

                      <div>
                        <span className={obterClasseStatus(compra.status)}>
                          {obterStatusCompraLabel(compra.status)}
                        </span>
                      </div>

                      {/* AÇÃO */}

                      <Link
                        href={`/compras/${compra.id}`}
                        className="compra-action"
                        aria-label={`Ver compra ${compra.numero}`}
                      >
                        <ArrowRight size={19} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* INFORMAÇÕES COMPLEMENTARES */}

        <section className="compras-footer-grid">
          <div className="admin-card compras-info-card">
            <div className="compras-info-icon">
              <Truck size={21} />
            </div>

            <div>
              <h3>Recebimento integrado</h3>

              <p>
                As compras recebidas poderão adicionar os produtos
                automaticamente ao estoque.
              </p>
            </div>
          </div>

          {resumo.canceladas > 0 && (
            <div className="admin-card compras-info-card compras-canceladas-card">
              <div className="compras-info-icon">
                <XCircle size={21} />
              </div>

              <div>
                <h3>
                  {resumo.canceladas}{" "}
                  {resumo.canceladas === 1
                    ? "compra cancelada"
                    : "compras canceladas"}
                </h3>

                <p>Compras canceladas não são consideradas no valor total.</p>
              </div>
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}
