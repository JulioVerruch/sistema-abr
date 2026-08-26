"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  Package,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { AppShell } from "../../../components/layout/AppShell";

import {
  obterMovimentacoes,
  type MovimentacaoEstoque,
} from "../../../data/movimentacoesStore";

export default function MovimentacoesPage() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);

  const [busca, setBusca] = useState("");

  const [tipoFiltro, setTipoFiltro] = useState<
    "todos" | MovimentacaoEstoque["tipo"]
  >("todos");

  const [carregando, setCarregando] = useState(true);

  /* =========================================================
     CARREGAR MOVIMENTAÇÕES
  ========================================================= */

  function carregarMovimentacoes() {
    try {
      setMovimentacoes(obterMovimentacoes());
    } catch (error) {
      console.error("Erro ao carregar movimentações:", error);

      setMovimentacoes([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarMovimentacoes();

    function atualizar() {
      carregarMovimentacoes();
    }

    window.addEventListener("abr-agro-movimentacoes-atualizadas", atualizar);

    window.addEventListener("abr-agro-produtos-atualizados", atualizar);

    window.addEventListener("abr-agro-vendas-atualizadas", atualizar);

    return () => {
      window.removeEventListener(
        "abr-agro-movimentacoes-atualizadas",
        atualizar,
      );

      window.removeEventListener("abr-agro-produtos-atualizados", atualizar);

      window.removeEventListener("abr-agro-vendas-atualizadas", atualizar);
    };
  }, []);

  /* =========================================================
     FILTRO
  ========================================================= */

  const movimentacoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return movimentacoes.filter((movimentacao) => {
      const correspondeBusca =
        !termo ||
        String(movimentacao.produtoNome ?? "")
          .toLowerCase()
          .includes(termo) ||
        String(movimentacao.produtoId ?? "")
          .toLowerCase()
          .includes(termo) ||
        String(movimentacao.motivo ?? "")
          .toLowerCase()
          .includes(termo);

      const correspondeTipo =
        tipoFiltro === "todos" || movimentacao.tipo === tipoFiltro;

      return correspondeBusca && correspondeTipo;
    });
  }, [movimentacoes, busca, tipoFiltro]);

  /* =========================================================
     RESUMO
  ========================================================= */

  const resumo = useMemo(() => {
    const entradas = movimentacoes.filter((item) => item.tipo === "entrada");

    const saidas = movimentacoes.filter((item) => item.tipo === "saida");

    const ajustes = movimentacoes.filter((item) => item.tipo === "ajuste");

    return {
      total: movimentacoes.length,
      entradas: entradas.length,
      saidas: saidas.length,
      ajustes: ajustes.length,
    };
  }, [movimentacoes]);

  /* =========================================================
     FORMATAÇÃO
  ========================================================= */

  function formatarData(data?: string) {
    if (!data) {
      return "—";
    }

    const valor = new Date(data);

    if (Number.isNaN(valor.getTime())) {
      return "—";
    }

    return valor.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function formatarTipo(tipo: MovimentacaoEstoque["tipo"]) {
    switch (tipo) {
      case "entrada":
        return "Entrada";

      case "saida":
        return "Saída";

      case "ajuste":
        return "Ajuste";

      default:
        return tipo;
    }
  }

  function obterMotivoLabel(motivo: string) {
    switch (motivo) {
      case "compra":
        return "Compra";

      case "venda":
        return "Venda";

      case "devolucao":
        return "Devolução";

      case "ajuste":
        return "Ajuste";

      case "inventario":
        return "Inventário";

      default:
        return motivo;
    }
  }

  function obterSinal(tipo: MovimentacaoEstoque["tipo"]) {
    if (tipo === "saida") {
      return "-";
    }

    if (tipo === "entrada") {
      return "+";
    }

    return "";
  }

  /* =========================================================
     PÁGINA
  ========================================================= */

  return (
    <AppShell
      title="Movimentações de estoque"
      description="Acompanhe todas as entradas, saídas e ajustes realizados no estoque."
    >
      <section className="admin-page movimentacoes-page">
        {/* =================================================
            CABEÇALHO
        ================================================== */}

        <div className="admin-page-header">
          <div>
            <span className="admin-eyebrow">Controle de estoque</span>

            <h2>Movimentações</h2>

            <p>Consulte o histórico de alterações realizadas no estoque.</p>
          </div>

          <div className="admin-page-actions">
            <Link href="/estoque" className="btn">
              <Package size={18} />
              Voltar para estoque
            </Link>
          </div>
        </div>

        {/* =================================================
            INDICADORES
        ================================================== */}

        <div className="movimentacoes-resumo">
          <button
            type="button"
            className={
              tipoFiltro === "todos"
                ? "movimentacoes-resumo-card ativo"
                : "movimentacoes-resumo-card"
            }
            onClick={() => setTipoFiltro("todos")}
          >
            <div className="movimentacoes-resumo-icon">
              <ClipboardList size={20} />
            </div>

            <div>
              <span>Total</span>

              <strong>{resumo.total}</strong>
            </div>
          </button>

          <button
            type="button"
            className={
              tipoFiltro === "entrada"
                ? "movimentacoes-resumo-card ativo"
                : "movimentacoes-resumo-card"
            }
            onClick={() => setTipoFiltro("entrada")}
          >
            <div className="movimentacoes-resumo-icon entrada">
              <ArrowDownToLine size={20} />
            </div>

            <div>
              <span>Entradas</span>

              <strong>{resumo.entradas}</strong>
            </div>
          </button>

          <button
            type="button"
            className={
              tipoFiltro === "saida"
                ? "movimentacoes-resumo-card ativo"
                : "movimentacoes-resumo-card"
            }
            onClick={() => setTipoFiltro("saida")}
          >
            <div className="movimentacoes-resumo-icon saida">
              <ArrowUpFromLine size={20} />
            </div>

            <div>
              <span>Saídas</span>

              <strong>{resumo.saidas}</strong>
            </div>
          </button>

          <button
            type="button"
            className={
              tipoFiltro === "ajuste"
                ? "movimentacoes-resumo-card ativo"
                : "movimentacoes-resumo-card"
            }
            onClick={() => setTipoFiltro("ajuste")}
          >
            <div className="movimentacoes-resumo-icon ajuste">
              <SlidersHorizontal size={20} />
            </div>

            <div>
              <span>Ajustes</span>

              <strong>{resumo.ajustes}</strong>
            </div>
          </button>
        </div>

        {/* =================================================
            FILTROS
        ================================================== */}

        <section className="admin-card movimentacoes-filtros">
          <div className="movimentacoes-busca">
            <Search size={18} />

            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por produto, código ou motivo..."
            />
          </div>

          <div className="movimentacoes-filtro-tipos">
            <button
              type="button"
              className={tipoFiltro === "todos" ? "ativo" : ""}
              onClick={() => setTipoFiltro("todos")}
            >
              Todas
            </button>

            <button
              type="button"
              className={tipoFiltro === "entrada" ? "ativo" : ""}
              onClick={() => setTipoFiltro("entrada")}
            >
              Entradas
            </button>

            <button
              type="button"
              className={tipoFiltro === "saida" ? "ativo" : ""}
              onClick={() => setTipoFiltro("saida")}
            >
              Saídas
            </button>

            <button
              type="button"
              className={tipoFiltro === "ajuste" ? "ativo" : ""}
              onClick={() => setTipoFiltro("ajuste")}
            >
              Ajustes
            </button>
          </div>
        </section>

        {/* =================================================
            LISTAGEM
        ================================================== */}

        <section className="admin-card movimentacoes-lista-card">
          <div className="admin-card-header">
            <div>
              <span className="admin-eyebrow">Histórico</span>

              <h3>Movimentações de estoque</h3>

              <p>
                {movimentacoesFiltradas.length}{" "}
                {movimentacoesFiltradas.length === 1
                  ? "movimentação encontrada"
                  : "movimentações encontradas"}
              </p>
            </div>

            <ClipboardList size={24} />
          </div>

          {carregando ? (
            <div className="admin-empty movimentacoes-empty">
              <ClipboardList size={30} />

              <strong>Carregando movimentações...</strong>
            </div>
          ) : movimentacoesFiltradas.length === 0 ? (
            <div className="admin-empty movimentacoes-empty">
              <div className="movimentacoes-empty-icon">
                <ClipboardList size={30} />
              </div>

              <strong>Nenhuma movimentação encontrada</strong>

              <span>
                {busca || tipoFiltro !== "todos"
                  ? "Tente alterar os filtros ou realizar uma nova busca."
                  : "As movimentações de estoque aparecerão aqui."}
              </span>
            </div>
          ) : (
            <div className="movimentacoes-tabela-wrapper">
              <div className="movimentacoes-tabela">
                {/* CABEÇALHO */}

                <div className="movimentacoes-tabela-header">
                  <span>Data</span>

                  <span>Produto</span>

                  <span>Tipo</span>

                  <span>Motivo</span>

                  <span>Quantidade</span>

                  <span>Estoque anterior</span>

                  <span>Estoque atual</span>

                  <span />
                </div>

                {/* LINHAS */}

                {movimentacoesFiltradas.map((movimentacao) => (
                  <Link
                    key={movimentacao.id}
                    href={`/estoque/movimentacoes/${movimentacao.id}`}
                    className="movimentacoes-tabela-row"
                  >
                    <div className="movimentacao-data">
                      <strong>{formatarData(movimentacao.criadoEm)}</strong>
                    </div>

                    <div className="movimentacao-produto">
                      <div className="movimentacao-produto-icon">
                        <Package size={17} />
                      </div>

                      <div>
                        <strong>{movimentacao.produtoNome}</strong>

                        <span>{movimentacao.produtoId}</span>
                      </div>
                    </div>

                    <div>
                      <span
                        className={`movimentacao-tipo tipo-${movimentacao.tipo}`}
                      >
                        {movimentacao.tipo === "entrada" ? (
                          <ArrowDownToLine size={14} />
                        ) : movimentacao.tipo === "saida" ? (
                          <ArrowUpFromLine size={14} />
                        ) : (
                          <SlidersHorizontal size={14} />
                        )}

                        {formatarTipo(movimentacao.tipo)}
                      </span>
                    </div>

                    <div className="movimentacao-motivo">
                      {obterMotivoLabel(movimentacao.motivo)}
                    </div>

                    <div
                      className={`movimentacao-quantidade tipo-${movimentacao.tipo}`}
                    >
                      <strong>
                        {obterSinal(movimentacao.tipo)}
                        {movimentacao.quantidade}
                      </strong>
                    </div>

                    <div className="movimentacao-estoque">
                      {movimentacao.estoqueAnterior}
                    </div>

                    <div className="movimentacao-estoque atual">
                      {movimentacao.estoqueAtual}
                    </div>

                    <div className="movimentacao-arrow">
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
