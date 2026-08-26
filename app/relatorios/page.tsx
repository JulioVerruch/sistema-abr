"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import {
  obterRelatorioGerencial,
  type LinhaGerencialPeriodo,
  type RelatorioGerencial,
} from "../../data/relatoriosStore";

const vazio: RelatorioGerencial = {
  faturamento: 0,
  compras: 0,
  entradas: 0,
  saidas: 0,
  resultado: 0,
  vendasConcluidas: 0,
  comprasConcluidas: 0,
  vendasCanceladas: 0,
  comprasCanceladas: 0,
  vendasPorPeriodo: [],
  comprasPorPeriodo: [],
  fluxoFinanceiro: [],
  evolucaoPorPeriodo: [],
  produtosMaisVendidos: [],
  clientesQueMaisCompram: [],
  fornecedoresMaiorVolume: [],
};

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function primeiroDiaMesISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

function inteiro(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(Number(valor) || 0);
}

function percentual(valor: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((valor / total) * 100)}%`;
}

function largura(valor: number, maior: number) {
  return maior > 0 ? Math.max(4, (valor / maior) * 100) : 0;
}

function maiorPeriodo(dados: LinhaGerencialPeriodo[]) {
  return Math.max(
    ...dados.flatMap((item) => [
      item.vendas,
      item.compras,
      item.entradas,
      item.saidas,
    ]),
    0,
  );
}

export default function RelatoriosPage() {
  const [inicio, setInicio] = useState(primeiroDiaMesISO());
  const [fim, setFim] = useState(hojeISO());
  const [dados, setDados] = useState<RelatorioGerencial>(vazio);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = () => {
    setAtualizando(true);
    try {
      setDados(obterRelatorioGerencial({ inicio, fim }));
    } finally {
      setAtualizando(false);
    }
  };

  useEffect(() => {
    carregar();

    const eventos = [
      "abr-agro-vendas-atualizadas",
      "abr-agro-compras-atualizadas",
      "abr-agro-caixa-atualizado",
      "abr-agro-contas-receber-atualizadas",
      "abr-agro-contas-pagar-atualizadas",
      "abr-agro-movimentacoes-atualizadas",
      "abr-agro-estoque-atualizado",
      "storage",
    ];

    eventos.forEach((evento) => window.addEventListener(evento, carregar));

    return () => {
      eventos.forEach((evento) =>
        window.removeEventListener(evento, carregar),
      );
    };
  }, [inicio, fim]);

  const maior = useMemo(
    () => maiorPeriodo(dados.evolucaoPorPeriodo),
    [dados.evolucaoPorPeriodo],
  );

  return (
    <AppShell
      title="Relatórios"
      description="Visão gerencial consolidada das operações do negócio."
    >
      <main className="admin-page relatorio-page relatorio-gerencial-page">
        <header className="relatorio-header">
          <div>
            <Link href="/relatorios" className="relatorio-back">
              <ArrowLeft size={15} /> Relatórios
            </Link>
            <span className="admin-eyebrow">VISÃO GERENCIAL</span>
            <h1>Relatório Gerencial</h1>
            <p>
              Uma visão consolidada de vendas, compras e movimentação
              financeira no período selecionado.
            </p>
          </div>

          <button
            type="button"
            className="btn primary relatorio-refresh"
            onClick={carregar}
            disabled={atualizando}
          >
            <RefreshCw
              size={16}
              className={atualizando ? "is-spinning" : ""}
            />
            Atualizar
          </button>
        </header>

        <section className="relatorio-filtros relatorio-gerencial-filtros">
          <div className="relatorio-filtro">
            <CalendarDays size={16} />
            <label htmlFor="gerencial-inicio">De</label>
            <input
              id="gerencial-inicio"
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>

          <div className="relatorio-filtro">
            <CalendarDays size={16} />
            <label htmlFor="gerencial-fim">Até</label>
            <input
              id="gerencial-fim"
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
            />
          </div>

          <div className="relatorio-gerencial-filter-note">
            <span>Período analisado</span>
            <strong>
              {new Date(`${inicio}T12:00:00`).toLocaleDateString("pt-BR")}{" "}
              —{" "}
              {new Date(`${fim}T12:00:00`).toLocaleDateString("pt-BR")}
            </strong>
          </div>
        </section>

        <section className="relatorio-kpis relatorio-gerencial-kpis">
          <article className="relatorio-kpi gerencial-kpi-highlight">
            <div className="relatorio-kpi-icon is-success">
              <TrendingUp size={19} />
            </div>
            <span>Faturamento</span>
            <strong>{moeda(dados.faturamento)}</strong>
            <small>
              {inteiro(dados.vendasConcluidas)} vendas concluídas
            </small>
          </article>

          <article className="relatorio-kpi">
            <div className="relatorio-kpi-icon">
              <ShoppingCart size={19} />
            </div>
            <span>Compras</span>
            <strong>{moeda(dados.compras)}</strong>
            <small>
              {inteiro(dados.comprasConcluidas)} compras recebidas
            </small>
          </article>

          <article className="relatorio-kpi">
            <div className="relatorio-kpi-icon is-success">
              <ArrowDownToLine size={19} />
            </div>
            <span>Entradas</span>
            <strong>{moeda(dados.entradas)}</strong>
            <small>Movimentações de entrada no Caixa</small>
          </article>

          <article className="relatorio-kpi relatorio-kpi-danger">
            <div className="relatorio-kpi-icon">
              <ArrowUpFromLine size={19} />
            </div>
            <span>Saídas</span>
            <strong>{moeda(dados.saidas)}</strong>
            <small>Movimentações de saída no Caixa</small>
          </article>

          <article
            className={`relatorio-kpi ${
              dados.resultado >= 0
                ? "gerencial-kpi-positive"
                : "gerencial-kpi-negative"
            }`}
          >
            <div className="relatorio-kpi-icon">
              <CircleDollarSign size={19} />
            </div>
            <span>Resultado</span>
            <strong>{moeda(dados.resultado)}</strong>
            <small>Entradas menos saídas no período</small>
          </article>
        </section>

        <section className="relatorio-card gerencial-evolucao-card">
          <header className="relatorio-card-header">
            <div>
              <span>EVOLUÇÃO</span>
              <h2>Visão por período</h2>
            </div>
            <BarChart3 size={20} />
          </header>

          {dados.evolucaoPorPeriodo.length ? (
            <div className="gerencial-evolucao">
              <div className="gerencial-evolucao-legend">
                <span><i className="is-vendas" /> Vendas</span>
                <span><i className="is-compras" /> Compras</span>
                <span><i className="is-entradas" /> Entradas</span>
                <span><i className="is-saidas" /> Saídas</span>
              </div>

              {dados.evolucaoPorPeriodo.map((item) => (
                <div className="gerencial-periodo" key={item.periodo}>
                  <div className="gerencial-periodo-head">
                    <strong>{item.label}</strong>
                    <span>
                      Resultado: <b>{moeda(item.resultado)}</b>
                    </span>
                  </div>

                  <div className="gerencial-periodo-bars">
                    <div>
                      <span>Vendas</span>
                      <div className="gerencial-track">
                        <i
                          className="is-vendas"
                          style={{ width: `${largura(item.vendas, maior)}%` }}
                        />
                      </div>
                      <b>{moeda(item.vendas)}</b>
                    </div>

                    <div>
                      <span>Compras</span>
                      <div className="gerencial-track">
                        <i
                          className="is-compras"
                          style={{ width: `${largura(item.compras, maior)}%` }}
                        />
                      </div>
                      <b>{moeda(item.compras)}</b>
                    </div>

                    <div>
                      <span>Entradas</span>
                      <div className="gerencial-track">
                        <i
                          className="is-entradas"
                          style={{ width: `${largura(item.entradas, maior)}%` }}
                        />
                      </div>
                      <b>{moeda(item.entradas)}</b>
                    </div>

                    <div>
                      <span>Saídas</span>
                      <div className="gerencial-track">
                        <i
                          className="is-saidas"
                          style={{ width: `${largura(item.saidas, maior)}%` }}
                        />
                      </div>
                      <b>{moeda(item.saidas)}</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relatorio-empty">
              <CalendarDays size={24} />
              Nenhum dado encontrado no período.
            </div>
          )}
        </section>

        <section className="gerencial-three-grid">
          <article className="relatorio-card">
            <header className="relatorio-card-header">
              <div>
                <span>COMERCIAL</span>
                <h2>Vendas por período</h2>
              </div>
              <TrendingUp size={20} />
            </header>

            {dados.vendasPorPeriodo.length ? (
              <div className="gerencial-simple-list">
                {dados.vendasPorPeriodo.map((item) => (
                  <div className="gerencial-simple-row" key={item.periodo}>
                    <div>
                      <strong>{item.label}</strong>
                      <small>{inteiro(item.quantidade)} vendas</small>
                    </div>
                    <b>{moeda(item.valor)}</b>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relatorio-empty">Sem vendas no período.</div>
            )}
          </article>

          <article className="relatorio-card">
            <header className="relatorio-card-header">
              <div>
                <span>SUPRIMENTOS</span>
                <h2>Compras por período</h2>
              </div>
              <Truck size={20} />
            </header>

            {dados.comprasPorPeriodo.length ? (
              <div className="gerencial-simple-list">
                {dados.comprasPorPeriodo.map((item) => (
                  <div className="gerencial-simple-row" key={item.periodo}>
                    <div>
                      <strong>{item.label}</strong>
                      <small>{inteiro(item.quantidade)} compras</small>
                    </div>
                    <b>{moeda(item.valor)}</b>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relatorio-empty">Sem compras no período.</div>
            )}
          </article>

          <article className="relatorio-card">
            <header className="relatorio-card-header">
              <div>
                <span>CAIXA</span>
                <h2>Fluxo financeiro</h2>
              </div>
              <Wallet size={20} />
            </header>

            {dados.fluxoFinanceiro.length ? (
              <div className="gerencial-simple-list">
                {dados.fluxoFinanceiro.map((item) => (
                  <div className="gerencial-simple-row" key={item.periodo}>
                    <div>
                      <strong>{item.label}</strong>
                      <small>
                        + {moeda(item.entradas)} · − {moeda(item.saidas)}
                      </small>
                    </div>
                    <b
                      className={
                        item.resultado >= 0
                          ? "gerencial-positive"
                          : "gerencial-negative"
                      }
                    >
                      {moeda(item.resultado)}
                    </b>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relatorio-empty">Sem movimentação no período.</div>
            )}
          </article>
        </section>

        <section className="gerencial-three-grid gerencial-ranking-grid">
          <article className="relatorio-card">
            <header className="relatorio-card-header">
              <div>
                <span>PRODUTOS</span>
                <h2>Mais vendidos</h2>
              </div>
              <Package size={20} />
            </header>

            {dados.produtosMaisVendidos.length ? (
              <div className="gerencial-ranking-list">
                {dados.produtosMaisVendidos.map((item, index) => {
                  const max = dados.produtosMaisVendidos[0]?.quantidade || 1;
                  return (
                    <div className="gerencial-ranking-row" key={item.id}>
                      <span className="gerencial-rank">{index + 1}</span>
                      <div className="gerencial-ranking-main">
                        <div>
                          <strong>{item.nome}</strong>
                          <small>
                            {inteiro(item.quantidade)} unidades ·{" "}
                            {moeda(item.faturamento)}
                          </small>
                        </div>
                        <i>
                          <b
                            style={{
                              width: `${largura(item.quantidade, max)}%`,
                            }}
                          />
                        </i>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="relatorio-empty">Sem produtos vendidos.</div>
            )}
          </article>

          <article className="relatorio-card">
            <header className="relatorio-card-header">
              <div>
                <span>CLIENTES</span>
                <h2>Quem mais compra</h2>
              </div>
              <Users size={20} />
            </header>

            {dados.clientesQueMaisCompram.length ? (
              <div className="gerencial-ranking-list">
                {dados.clientesQueMaisCompram.map((item, index) => (
                  <div className="gerencial-ranking-row" key={item.id}>
                    <span className="gerencial-rank">{index + 1}</span>
                    <div className="gerencial-ranking-main">
                      <div>
                        <strong>{item.nome}</strong>
                        <small>
                          {inteiro(item.quantidade)} compras · ticket{" "}
                          {moeda(item.ticketMedio)}
                        </small>
                      </div>
                      <b>{moeda(item.valor)}</b>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relatorio-empty">Sem clientes no período.</div>
            )}
          </article>

          <article className="relatorio-card">
            <header className="relatorio-card-header">
              <div>
                <span>FORNECEDORES</span>
                <h2>Maior volume</h2>
              </div>
              <Truck size={20} />
            </header>

            {dados.fornecedoresMaiorVolume.length ? (
              <div className="gerencial-ranking-list">
                {dados.fornecedoresMaiorVolume.map((item, index) => (
                  <div className="gerencial-ranking-row" key={item.id}>
                    <span className="gerencial-rank">{index + 1}</span>
                    <div className="gerencial-ranking-main">
                      <div>
                        <strong>{item.nome}</strong>
                        <small>
                          {inteiro(item.quantidade)} compras · pendente{" "}
                          {moeda(item.pendente)}
                        </small>
                      </div>
                      <b>{moeda(item.valor)}</b>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relatorio-empty">
                Sem fornecedores no período.
              </div>
            )}
          </article>
        </section>

        <section className="gerencial-footer-links">
          <Link href="/relatorios/vendas">
            <ShoppingCart size={16} />
            Relatório de vendas
            <ChevronRight size={15} />
          </Link>
          <Link href="/relatorios/compras">
            <Truck size={16} />
            Relatório de compras
            <ChevronRight size={15} />
          </Link>
          <Link href="/relatorios/financeiro">
            <Wallet size={16} />
            Relatório financeiro
            <ChevronRight size={15} />
          </Link>
        </section>
      </main>
    </AppShell>
  );
}
