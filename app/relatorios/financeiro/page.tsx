"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  RefreshCw,
  Wallet,
  AlertTriangle,
  Receipt,
  TrendingUp,
} from "lucide-react";

import { AppShell } from "../../../components/layout/AppShell";
import {
  obterRelatorioFinanceiro,
  type RelatorioFinanceiro,
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
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function primeiroDiaMesISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

const vazio: RelatorioFinanceiro = {
  entradas: 0,
  saidas: 0,
  saldo: 0,
  contasRecebidas: 0,
  contasPagas: 0,
  quantidadeContasRecebidas: 0,
  quantidadeContasPagas: 0,
  contasEmAberto: 0,
  contasVencidas: 0,
  valorContasEmAberto: 0,
  valorContasVencidas: 0,
  fluxoDeCaixa: [],
};

export default function RelatorioFinanceiroPage() {
  const [inicio, setInicio] = useState(primeiroDiaMesISO());
  const [fim, setFim] = useState(hojeISO());
  const [dados, setDados] = useState<RelatorioFinanceiro>(vazio);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = () => {
    setAtualizando(true);
    try {
      setDados(obterRelatorioFinanceiro({ inicio, fim }));
    } finally {
      setAtualizando(false);
    }
  };

  useEffect(() => {
    carregar();
    const eventos = [
      "abr-agro-caixa-atualizado",
      "abr-agro-contas-receber-atualizadas",
      "abr-agro-contas-pagar-atualizadas",
      "storage",
    ];
    eventos.forEach((evento) => window.addEventListener(evento, carregar));
    return () =>
      eventos.forEach((evento) => window.removeEventListener(evento, carregar));
  }, [inicio, fim]);

  const maiorFluxo = useMemo(
    () =>
      Math.max(
        ...dados.fluxoDeCaixa.map((item) =>
          Math.max(item.entradas, item.saidas),
        ),
        0,
      ),
    [dados.fluxoDeCaixa],
  );

  return (
    <AppShell
      title="Relatório Financeiro"
      description="Entradas, saídas, contas e fluxo de caixa."
    >
      <main className="admin-page relatorio-page">
        <header className="relatorio-header">
          <div>
            <Link href="/relatorios" className="relatorio-back">
              <ArrowLeft size={15} /> Relatórios
            </Link>
            <span className="admin-eyebrow">RELATÓRIO FINANCEIRO</span>
            <h1>Financeiro</h1>
            <p>Consolide o movimento financeiro e as obrigações do período.</p>
          </div>
          <button
            type="button"
            className="btn primary relatorio-refresh"
            onClick={carregar}
            disabled={atualizando}
          >
            <RefreshCw size={16} className={atualizando ? "is-spinning" : ""} />{" "}
            Atualizar
          </button>
        </header>

        <section className="relatorio-filtros">
          <div className="relatorio-filtro">
            <CalendarDays size={16} />
            <label htmlFor="financeiro-inicio">De</label>
            <input
              id="financeiro-inicio"
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>
          <div className="relatorio-filtro">
            <CalendarDays size={16} />
            <label htmlFor="financeiro-fim">Até</label>
            <input
              id="financeiro-fim"
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
            <strong>{moeda(dados.entradas)}</strong>
          </article>
          <article className="relatorio-kpi">
            <div className="relatorio-kpi-icon">
              <ArrowUpFromLine size={19} />
            </div>
            <span>Saídas</span>
            <strong>{moeda(dados.saidas)}</strong>
          </article>
          <article className="relatorio-kpi">
            <div className="relatorio-kpi-icon">
              <Wallet size={19} />
            </div>
            <span>Saldo atual</span>
            <strong>{moeda(dados.saldo)}</strong>
          </article>
          <article className="relatorio-kpi">
            <div className="relatorio-kpi-icon is-success">
              <Receipt size={19} />
            </div>
            <span>Contas recebidas</span>
            <strong>{moeda(dados.contasRecebidas)}</strong>
          </article>
          <article className="relatorio-kpi">
            <div className="relatorio-kpi-icon">
              <CreditCard size={19} />
            </div>
            <span>Contas pagas</span>
            <strong>{moeda(dados.contasPagas)}</strong>
          </article>
          <article className="relatorio-kpi relatorio-kpi-warning">
            <div className="relatorio-kpi-icon">
              <AlertTriangle size={19} />
            </div>
            <span>Contas vencidas</span>
            <strong>{moeda(dados.valorContasVencidas)}</strong>
          </article>
        </section>

        <section className="relatorio-grid">
          <article className="relatorio-card">
            <header className="relatorio-card-header">
              <div>
                <span>OBRIGAÇÕES</span>
                <h2>Contas em aberto</h2>
              </div>
              <Receipt size={20} />
            </header>
            <div className="relatorio-financeiro-resumo">
              <div>
                <span>Quantidade</span>
                <strong>{inteiro(dados.contasEmAberto)}</strong>
              </div>
              <div>
                <span>Valor em aberto</span>
                <strong>{moeda(dados.valorContasEmAberto)}</strong>
              </div>
              <div>
                <span>Vencidas</span>
                <strong className="relatorio-value-danger">
                  {inteiro(dados.contasVencidas)}
                </strong>
              </div>
              <div>
                <span>Valor vencido</span>
                <strong className="relatorio-value-danger">
                  {moeda(dados.valorContasVencidas)}
                </strong>
              </div>
            </div>
            <div className="relatorio-links">
              <Link href="/financeiro/contas-receber">Contas a receber →</Link>
              <Link href="/financeiro/contas-pagar">Contas a pagar →</Link>
            </div>
          </article>

          <article className="relatorio-card">
            <header className="relatorio-card-header">
              <div>
                <span>FLUXO</span>
                <h2>Resultado do período</h2>
              </div>
              <TrendingUp size={20} />
            </header>
            {dados.fluxoDeCaixa.length ? (
              <div className="relatorio-periodos">
                {dados.fluxoDeCaixa.map((item) => {
                  const largura = maiorFluxo
                    ? (Math.max(item.entradas, item.saidas) / maiorFluxo) * 100
                    : 0;
                  return (
                    <div className="relatorio-periodo" key={item.periodo}>
                      <div className="relatorio-periodo-label">
                        <span>{item.label}</span>
                        <strong
                          className={
                            item.resultado >= 0
                              ? "relatorio-value-success"
                              : "relatorio-value-danger"
                          }
                        >
                          {moeda(item.resultado)}
                        </strong>
                      </div>
                      <div className="relatorio-bar">
                        <span style={{ width: `${largura}%` }} />
                      </div>
                      <small>
                        Entradas {moeda(item.entradas)} · Saídas{" "}
                        {moeda(item.saidas)}
                      </small>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="relatorio-empty">
                <CalendarDays size={24} />
                Nenhum lançamento no período.
              </div>
            )}
          </article>
        </section>

        <section className="relatorio-card">
          <header className="relatorio-card-header">
            <div>
              <span>FLUXO DE CAIXA</span>
              <h2>Movimentação por período</h2>
            </div>
            <CircleDollarSign size={20} />
          </header>
          {dados.fluxoDeCaixa.length ? (
            <div className="relatorio-table-wrap">
              <table className="relatorio-table">
                <thead>
                  <tr>
                    <th>Período</th>
                    <th>Entradas</th>
                    <th>Saídas</th>
                    <th>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.fluxoDeCaixa.map((item) => (
                    <tr key={item.periodo}>
                      <td>
                        <strong>{item.label}</strong>
                      </td>
                      <td className="relatorio-value-success">
                        {moeda(item.entradas)}
                      </td>
                      <td>{moeda(item.saidas)}</td>
                      <td
                        className={
                          item.resultado >= 0
                            ? "relatorio-value-success"
                            : "relatorio-value-danger"
                        }
                      >
                        <strong>{moeda(item.resultado)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="relatorio-empty">
              <Wallet size={24} />
              Nenhum fluxo financeiro encontrado.
            </div>
          )}
        </section>

        <section className="relatorio-grid relatorio-grid-3">
          <article className="relatorio-card relatorio-mini-card">
            <span>CONTAS RECEBIDAS</span>
            <strong>{inteiro(dados.quantidadeContasRecebidas)}</strong>
            <small>{moeda(dados.contasRecebidas)}</small>
          </article>
          <article className="relatorio-card relatorio-mini-card">
            <span>CONTAS PAGAS</span>
            <strong>{inteiro(dados.quantidadeContasPagas)}</strong>
            <small>{moeda(dados.contasPagas)}</small>
          </article>
          <article className="relatorio-card relatorio-mini-card">
            <span>CONTAS VENCIDAS</span>
            <strong className="relatorio-value-danger">
              {inteiro(dados.contasVencidas)}
            </strong>
            <small>{moeda(dados.valorContasVencidas)}</small>
          </article>
        </section>
      </main>
    </AppShell>
  );
}
