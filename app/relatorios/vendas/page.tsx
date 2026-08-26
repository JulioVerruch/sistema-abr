"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";

import { AppShell } from "../../../components/layout/AppShell";
import {
  obterRelatorioVendas,
  type RelatorioVendas,
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
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function primeiroDiaMesISO() {
  const data = new Date();
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function RelatorioVendasPage() {
  const [inicio, setInicio] = useState(primeiroDiaMesISO());
  const [fim, setFim] = useState(hojeISO());
  const [dados, setDados] = useState<RelatorioVendas | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = () => {
    setAtualizando(true);
    try {
      setDados(obterRelatorioVendas({ inicio, fim }));
    } finally {
      setAtualizando(false);
    }
  };

  useEffect(() => {
    carregar();

    const eventos = [
      "abr-agro-vendas-atualizadas",
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
    faturamento: 0,
    vendasConcluidas: 0,
    vendasCanceladas: 0,
    quantidadeVendida: 0,
    ticketMedio: 0,
    vendasPorPeriodo: [],
    vendasPorFormaPagamento: [],
    vendasPorCliente: [],
    produtosMaisVendidos: [],
  };

  const maiorPeriodo = useMemo(
    () =>
      Math.max(...relatorio.vendasPorPeriodo.map((item) => item.valor), 0),
    [relatorio.vendasPorPeriodo],
  );

  return (
    <AppShell
      title="Relatório de Vendas"
      description="Faturamento, desempenho comercial, clientes e produtos vendidos."
    >
      <main className="admin-page relatorio-page">
        <header className="relatorio-header">
          <div>
            <Link href="/relatorios" className="relatorio-back">
              <ArrowLeft size={15} />
              Relatórios
            </Link>
            <span className="admin-eyebrow">RELATÓRIO COMERCIAL</span>
            <h1>Vendas</h1>
            <p>Analise o desempenho das vendas no período selecionado.</p>
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
            <label htmlFor="vendas-inicio">De</label>
            <input
              id="vendas-inicio"
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>

          <div className="relatorio-filtro">
            <CalendarDays size={16} />
            <label htmlFor="vendas-fim">Até</label>
            <input
              id="vendas-fim"
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
            <span>Faturamento</span>
            <strong>{moeda(relatorio.faturamento)}</strong>
          </article>

          <article className="relatorio-kpi">
            <div className="relatorio-kpi-icon">
              <ShoppingBag size={19} />
            </div>
            <span>Vendas concluídas</span>
            <strong>{inteiro(relatorio.vendasConcluidas)}</strong>
          </article>

          <article className="relatorio-kpi">
            <div className="relatorio-kpi-icon">
              <Package size={19} />
            </div>
            <span>Quantidade vendida</span>
            <strong>{inteiro(relatorio.quantidadeVendida)}</strong>
          </article>

          <article className="relatorio-kpi">
            <div className="relatorio-kpi-icon">
              <TrendingUp size={19} />
            </div>
            <span>Ticket médio</span>
            <strong>{moeda(relatorio.ticketMedio)}</strong>
          </article>

          <article className="relatorio-kpi relatorio-kpi-danger">
            <div className="relatorio-kpi-icon">
              <BarChart3 size={19} />
            </div>
            <span>Vendas canceladas</span>
            <strong>{inteiro(relatorio.vendasCanceladas)}</strong>
          </article>
        </section>

        <section className="relatorio-grid relatorio-grid-main">
          <article className="relatorio-card">
            <header className="relatorio-card-header">
              <div>
                <span>EVOLUÇÃO</span>
                <h2>Vendas por período</h2>
              </div>
            </header>

            {relatorio.vendasPorPeriodo.length ? (
              <div className="relatorio-periodos">
                {relatorio.vendasPorPeriodo.map((item) => {
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
                        {item.quantidade === 1 ? "venda" : "vendas"}
                      </small>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="relatorio-empty">
                <CalendarDays size={24} />
                Nenhuma venda concluída no período.
              </div>
            )}
          </article>

          <article className="relatorio-card">
            <header className="relatorio-card-header">
              <div>
                <span>PAGAMENTOS</span>
                <h2>Por forma de pagamento</h2>
              </div>
            </header>

            {relatorio.vendasPorFormaPagamento.length ? (
              <div className="relatorio-list">
                {relatorio.vendasPorFormaPagamento.map((item) => (
                  <div className="relatorio-list-row" key={item.forma}>
                    <div className="relatorio-list-info">
                      <strong>{item.forma}</strong>
                      <small>
                        {inteiro(item.quantidade)} vendas · {item.percentual}%
                      </small>
                    </div>
                    <b>{moeda(item.valor)}</b>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relatorio-empty">
                <CircleDollarSign size={24} />
                Nenhum pagamento no período.
              </div>
            )}
          </article>
        </section>

        <section className="relatorio-grid">
          <article className="relatorio-card">
            <header className="relatorio-card-header">
              <div>
                <span>CLIENTES</span>
                <h2>Vendas por cliente</h2>
              </div>
              <Users size={20} />
            </header>

            {relatorio.vendasPorCliente.length ? (
              <div className="relatorio-table-wrap">
                <table className="relatorio-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Vendas</th>
                      <th>Ticket médio</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.vendasPorCliente.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.nome}</strong></td>
                        <td>{inteiro(item.quantidade)}</td>
                        <td>{moeda(item.ticketMedio)}</td>
                        <td><strong>{moeda(item.valor)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="relatorio-empty">Nenhum cliente no período.</div>
            )}
          </article>

          <article className="relatorio-card">
            <header className="relatorio-card-header">
              <div>
                <span>PRODUTOS</span>
                <h2>Mais vendidos</h2>
              </div>
              <Package size={20} />
            </header>

            {relatorio.produtosMaisVendidos.length ? (
              <div className="relatorio-table-wrap">
                <table className="relatorio-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Quantidade</th>
                      <th>Faturamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.produtosMaisVendidos.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.nome}</strong></td>
                        <td>{inteiro(item.quantidade)}</td>
                        <td><strong>{moeda(item.faturamento)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="relatorio-empty">Nenhum produto vendido no período.</div>
            )}
          </article>
        </section>
      </main>
    </AppShell>
  );
}
