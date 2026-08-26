"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CalendarDays,
  ClipboardList,
  Package,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";

import { AppShell } from "../../components/layout/AppShell";
import {
  obterRelatorioEstoque,
  type RelatorioEstoque,
} from "../../data/relatoriosStore";

function inteiro(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(valor || 0);
}

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function primeiroDiaMesISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

const vazio: RelatorioEstoque = {
  entradas: 0,
  saidas: 0,
  ajustes: 0,
  estornos: 0,
  totalMovimentacoes: 0,
  produtosEstoqueBaixo: [],
  movimentacaoPorProduto: [],
  movimentacaoPorPeriodo: [],
};

export default function RelatorioEstoquePage() {
  const [inicio, setInicio] = useState(primeiroDiaMesISO());
  const [fim, setFim] = useState(hojeISO());
  const [dados, setDados] = useState<RelatorioEstoque>(vazio);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = () => {
    setAtualizando(true);
    try {
      setDados(obterRelatorioEstoque({ inicio, fim }));
    } finally {
      setAtualizando(false);
    }
  };

  useEffect(() => {
    carregar();
    const eventos = [
      "abr-agro-movimentacoes-atualizadas",
      "abr-agro-estoque-atualizado",
      "storage",
    ];
    eventos.forEach((evento) => window.addEventListener(evento, carregar));
    return () =>
      eventos.forEach((evento) => window.removeEventListener(evento, carregar));
  }, [inicio, fim]);

  const maiorPeriodo = useMemo(
    () =>
      Math.max(
        ...dados.movimentacaoPorPeriodo.map(
          (item) => item.entradas + item.saidas + item.ajustes + item.estornos,
        ),
        0,
      ),
    [dados.movimentacaoPorPeriodo],
  );

  return (
    <AppShell
      title="Relatório de Estoque"
      description="Movimentações, estornos, ajustes e produtos com estoque baixo."
    >
      <main className="admin-page relatorio-page">
        <header className="relatorio-header">
          <div>
            <Link href="/relatorios" className="relatorio-back">
              <ArrowLeft size={15} /> Relatórios
            </Link>
            <span className="admin-eyebrow">RELATÓRIO OPERACIONAL</span>
            <h1>Estoque</h1>
            <p>
              Analise a movimentação física do estoque no período selecionado.
            </p>
          </div>
          <button
            type="button"
            className="btn primary relatorio-refresh"
            onClick={carregar}
            disabled={atualizando}
          >
            <RefreshCw size={16} className={atualizando ? "is-spinning" : ""} />
            Atualizar
          </button>
        </header>

        <section className="relatorio-filtros">
          <div className="relatorio-filtro">
            <CalendarDays size={16} />
            <label htmlFor="estoque-inicio">De</label>
            <input
              id="estoque-inicio"
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>
          <div className="relatorio-filtro">
            <CalendarDays size={16} />
            <label htmlFor="estoque-fim">Até</label>
            <input
              id="estoque-fim"
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
            />
          </div>
        </section>

        <section className="relatorio-kpis relatorio-kpis-6">
          <article className="relatorio-kpi">
            <div className="relatorio-kpi-icon is-success">
              <ArrowDownToLine size={19} />
            </div>
            <span>Entradas</span>
            <strong>{inteiro(dados.entradas)}</strong>
          </article>
          <article className="relatorio-kpi">
            <div className="relatorio-kpi-icon">
              <ArrowUpFromLine size={19} />
            </div>
            <span>Saídas</span>
            <strong>{inteiro(dados.saidas)}</strong>
          </article>
          <article className="relatorio-kpi">
            <div className="relatorio-kpi-icon">
              <SlidersHorizontal size={19} />
            </div>
            <span>Ajustes</span>
            <strong>{inteiro(dados.ajustes)}</strong>
          </article>
          <article className="relatorio-kpi">
            <div className="relatorio-kpi-icon">
              <RotateCcw size={19} />
            </div>
            <span>Estornos</span>
            <strong>{inteiro(dados.estornos)}</strong>
          </article>
          <article className="relatorio-kpi">
            <div className="relatorio-kpi-icon">
              <ClipboardList size={19} />
            </div>
            <span>Movimentações</span>
            <strong>{inteiro(dados.totalMovimentacoes)}</strong>
          </article>
          <article className="relatorio-kpi relatorio-kpi-warning">
            <div className="relatorio-kpi-icon">
              <TriangleAlert size={19} />
            </div>
            <span>Estoque baixo</span>
            <strong>{inteiro(dados.produtosEstoqueBaixo.length)}</strong>
          </article>
        </section>

        <section className="relatorio-grid relatorio-grid-main">
          <article className="relatorio-card">
            <header className="relatorio-card-header">
              <div>
                <span>EVOLUÇÃO</span>
                <h2>Movimentação por período</h2>
              </div>
              <Boxes size={20} />
            </header>
            {dados.movimentacaoPorPeriodo.length ? (
              <div className="relatorio-periodos">
                {dados.movimentacaoPorPeriodo.map((item) => {
                  const total =
                    item.entradas + item.saidas + item.ajustes + item.estornos;
                  const largura = maiorPeriodo
                    ? (total / maiorPeriodo) * 100
                    : 0;
                  return (
                    <div className="relatorio-periodo" key={item.periodo}>
                      <div className="relatorio-periodo-label">
                        <span>{item.label}</span>
                        <strong>{inteiro(total)} movimentações</strong>
                      </div>
                      <div className="relatorio-bar">
                        <span style={{ width: `${largura}%` }} />
                      </div>
                      <small>
                        Entradas {inteiro(item.entradas)} · Saídas{" "}
                        {inteiro(item.saidas)} · Ajustes {inteiro(item.ajustes)}{" "}
                        · Estornos {inteiro(item.estornos)}
                      </small>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="relatorio-empty">
                <CalendarDays size={24} />
                Nenhuma movimentação no período.
              </div>
            )}
          </article>

          <article className="relatorio-card">
            <header className="relatorio-card-header">
              <div>
                <span>ATENÇÃO</span>
                <h2>Produtos com estoque baixo</h2>
              </div>
              <TriangleAlert size={20} />
            </header>
            {dados.produtosEstoqueBaixo.length ? (
              <div className="relatorio-list">
                {dados.produtosEstoqueBaixo.slice(0, 10).map((item) => (
                  <div className="relatorio-list-row" key={item.id}>
                    <div>
                      <strong>{item.nome}</strong>
                      <small>
                        {item.codigo} · mínimo {inteiro(item.minimo)}
                      </small>
                    </div>
                    <strong className="relatorio-value-danger">
                      {inteiro(item.estoque)}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relatorio-empty">
                <Package size={24} />
                Nenhum produto abaixo do limite.
              </div>
            )}
          </article>
        </section>

        <section className="relatorio-card">
          <header className="relatorio-card-header">
            <div>
              <span>DETALHAMENTO</span>
              <h2>Movimentação por produto</h2>
            </div>
            <Package size={20} />
          </header>
          {dados.movimentacaoPorProduto.length ? (
            <div className="relatorio-table-wrap">
              <table className="relatorio-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Entradas</th>
                    <th>Saídas</th>
                    <th>Ajustes</th>
                    <th>Estornos</th>
                    <th>Mov.</th>
                    <th>Saldo mov.</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.movimentacaoPorProduto.map((item) => (
                    <tr key={item.produtoId}>
                      <td>
                        <strong>{item.nome}</strong>
                        <small>{item.codigo}</small>
                      </td>
                      <td>{inteiro(item.entradas)}</td>
                      <td>{inteiro(item.saidas)}</td>
                      <td>{inteiro(item.ajustes)}</td>
                      <td>{inteiro(item.estornos)}</td>
                      <td>{inteiro(item.movimentacoes)}</td>
                      <td>
                        <strong>{inteiro(item.saldoMovimentado)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="relatorio-empty">
              <Package size={24} />
              Nenhuma movimentação encontrada.
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
