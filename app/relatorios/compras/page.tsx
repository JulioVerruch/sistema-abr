"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Package,
  RefreshCw,
  Truck,
} from "lucide-react";

import { AppShell } from "../../../components/layout/AppShell";
import {
  obterRelatorioCompras,
  type RelatorioCompras,
} from "../../../data/relatoriosStore";

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
}

function inteiro(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(valor || 0);
}

function hojeISO() {
  const data = new Date();
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

function primeiroDiaMesISO() {
  const data = new Date();
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function RelatorioComprasPage() {
  const [inicio, setInicio] = useState(primeiroDiaMesISO());
  const [fim, setFim] = useState(hojeISO());
  const [dados, setDados] = useState<RelatorioCompras | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = () => {
    setAtualizando(true);
    try {
      setDados(obterRelatorioCompras({ inicio, fim }));
    } finally {
      setAtualizando(false);
    }
  };

  useEffect(() => {
    carregar();

    const eventos = [
      "abr-agro-compras-atualizadas",
      "abr-agro-contas-pagar-atualizadas",
      "storage",
    ];

    eventos.forEach((evento) => window.addEventListener(evento, carregar));

    return () => {
      eventos.forEach((evento) =>
        window.removeEventListener(evento, carregar),
      );
    };
  }, [inicio, fim]);

  const relatorio = dados ?? {
    totalComprado: 0,
    comprasConcluidas: 0,
    comprasCanceladas: 0,
    quantidadeCompras: 0,
    fornecedores: [],
    produtosComprados: [],
    comprasPorPeriodo: [],
    totalPago: 0,
    totalPendente: 0,
  };

  const maiorPeriodo = useMemo(
    () =>
      Math.max(...relatorio.comprasPorPeriodo.map((item) => item.valor), 0),
    [relatorio.comprasPorPeriodo],
  );

  return (
    <AppShell
      title="Relatório de Compras"
      description="Compras, fornecedores, produtos adquiridos e compromissos financeiros."
    >
      <main className="admin-page relatorio-page">
        <header className="relatorio-header">
          <div>
            <Link href="/relatorios" className="relatorio-back">
              <ArrowLeft size={15} />
              Relatórios
            </Link>
            <span className="admin-eyebrow">RELATÓRIO DE SUPRIMENTOS</span>
            <h1>Compras</h1>
            <p>Analise o volume comprado e os compromissos com fornecedores.</p>
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
            <label htmlFor="compras-inicio">De</label>
            <input
              id="compras-inicio"
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>

          <div className="relatorio-filtro">
            <CalendarDays size={16} />
            <label htmlFor="compras-fim">Até</label>
            <input
              id="compras-fim"
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
            />
          </div>
        </section>

        <section className="relatorio-kpis">
          <article className="relatorio-kpi">
            <div className="relatorio-kpi-icon">
              <CircleDollarSign size={19} />
            </div>
            <span>Total comprado</span>
            <strong>{moeda(relatorio.totalComprado)}</strong>
          </article>

          <article className="relatorio-kpi">
            <div className="relatorio-kpi-icon">
              <ClipboardList size={19} />
            </div>
            <span>Compras concluídas</span>
            <strong>{inteiro(relatorio.comprasConcluidas)}</strong>
          </article>

          <article className="relatorio-kpi">
            <div className="relatorio-kpi-icon">
              <Package size={19} />
            </div>
            <span>Compras registradas</span>
            <strong>{inteiro(relatorio.quantidadeCompras)}</strong>
          </article>

          <article className="relatorio-kpi">
            <div className="relatorio-kpi-icon is-success">
              <CircleDollarSign size={19} />
            </div>
            <span>Total pago</span>
            <strong>{moeda(relatorio.totalPago)}</strong>
          </article>

          <article className="relatorio-kpi relatorio-kpi-warning">
            <div className="relatorio-kpi-icon">
              <Truck size={19} />
            </div>
            <span>Pendente</span>
            <strong>{moeda(relatorio.totalPendente)}</strong>
          </article>

          <article className="relatorio-kpi relatorio-kpi-danger">
            <div className="relatorio-kpi-icon">
              <ClipboardList size={19} />
            </div>
            <span>Canceladas</span>
            <strong>{inteiro(relatorio.comprasCanceladas)}</strong>
          </article>
        </section>

        <section className="relatorio-grid relatorio-grid-main">
          <article className="relatorio-card">
            <header className="relatorio-card-header">
              <div>
                <span>EVOLUÇÃO</span>
                <h2>Compras por período</h2>
              </div>
            </header>

            {relatorio.comprasPorPeriodo.length ? (
              <div className="relatorio-periodos">
                {relatorio.comprasPorPeriodo.map((item) => {
                  const largura =
                    maiorPeriodo > 0 ? (item.valor / maiorPeriodo) * 100 : 0;

                  return (
                    <div className="relatorio-periodo" key={item.periodo}>
                      <div className="relatorio-periodo-label">
                        <span>{item.label}</span>
                        <strong>{moeda(item.valor)}</strong>
                      </div>
                      <div className="relatorio-bar">
                        <span style={{ width: `${largura}%` }} />
                      </div>
                      <small>
                        {inteiro(item.quantidade)}{" "}
                        {item.quantidade === 1 ? "compra" : "compras"}
                      </small>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="relatorio-empty">
                <CalendarDays size={24} />
                Nenhuma compra válida no período.
              </div>
            )}
          </article>

          <article className="relatorio-card">
            <header className="relatorio-card-header">
              <div>
                <span>FORNECEDORES</span>
                <h2>Maiores volumes</h2>
              </div>
              <Truck size={20} />
            </header>

            {relatorio.fornecedores.length ? (
              <div className="relatorio-table-wrap">
                <table className="relatorio-table">
                  <thead>
                    <tr>
                      <th>Fornecedor</th>
                      <th>Compras</th>
                      <th>Pago</th>
                      <th>Pendente</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.fornecedores.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.nome}</strong></td>
                        <td>{inteiro(item.quantidade)}</td>
                        <td>{moeda(item.pago)}</td>
                        <td>{moeda(item.pendente)}</td>
                        <td><strong>{moeda(item.valor)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="relatorio-empty">Nenhum fornecedor no período.</div>
            )}
          </article>
        </section>

        <section className="relatorio-grid">
          <article className="relatorio-card">
            <header className="relatorio-card-header">
              <div>
                <span>PRODUTOS</span>
                <h2>Produtos comprados</h2>
              </div>
              <Package size={20} />
            </header>

            {relatorio.produtosComprados.length ? (
              <div className="relatorio-table-wrap">
                <table className="relatorio-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Quantidade</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.produtosComprados.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.nome}</strong></td>
                        <td>{inteiro(item.quantidade)}</td>
                        <td><strong>{moeda(item.valor)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="relatorio-empty">Nenhum produto no período.</div>
            )}
          </article>

          <article className="relatorio-card relatorio-financeiro-card">
            <header className="relatorio-card-header">
              <div>
                <span>FINANCEIRO</span>
                <h2>Pagamentos e pendências</h2>
              </div>
              <CircleDollarSign size={20} />
            </header>

            <div className="relatorio-financeiro-summary">
              <div>
                <span>Pago</span>
                <strong>{moeda(relatorio.totalPago)}</strong>
              </div>
              <div>
                <span>Pendente</span>
                <strong>{moeda(relatorio.totalPendente)}</strong>
              </div>
              <div>
                <span>Comprometido</span>
                <strong>
                  {moeda(relatorio.totalPago + relatorio.totalPendente)}
                </strong>
              </div>
            </div>
          </article>
        </section>
      </main>
    </AppShell>
  );
}
